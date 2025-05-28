const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const axios = require('axios');

// Configurações
const CONFIG = {
// Verifica se a chave da API do Figma está definida
if (!process.env.FIGMA_API_KEY) {
  console.error('❌ Erro: A variável de ambiente FIGMA_API_KEY não está definida.');
  console.error('Por favor, adicione sua chave da API do Figma no arquivo .env');
  process.exit(1);
}

  FIGMA_API_KEY: 'process.env.FIGMA_API_KEY',
  FILE_KEY: 'pHrUcun54WaijaCoojHoYi',
  OUTPUT_DIR: path.join(__dirname, '../assets/icons'),
  BATCH_SIZE: 3,
  DELAY_BETWEEN_BATCHES: 1000,
};

// Mapeamento de categorias do Figma para pastas locais
const CATEGORY_MAPPING = {
  'Essentials': 'essentials',
  'Actions': 'actions',
  'Vehicles & Transportation': 'vehicles-transport',
  'Technology': 'technology',
  'Social': 'social',
  'Finance': 'finance'
};

// Configura o agente HTTPS
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Configura o cliente HTTP
const figmaApi = axios.create({
  baseURL: 'https://api.figma.com/v1',
  headers: { 'X-Figma-Token': CONFIG.FIGMA_API_KEY },
  httpsAgent: httpsAgent,
  timeout: 30000
});

// Cria um diretório se não existir
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ Pasta criada: ${path.relative(CONFIG.OUTPUT_DIR, dir)}`);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Baixa um ícone específico
async function downloadIcon(iconId, iconName, category) {
  const outputDir = path.join(CONFIG.OUTPUT_DIR, CATEGORY_MAPPING[category] || 'uncategorized');
  const outputPath = path.join(outputDir, `${iconName}.svg`);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      return { status: 'exists', path: outputPath };
    } catch (e) {}
    
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${CONFIG.FILE_KEY}`, {
      params: { ids: iconId, format: 'svg' }
    });
    
    if (!data.images || !data.images[iconId]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[iconId];
    
    // Garante que o diretório existe
    await ensureDir(outputDir);
    
    // Baixa a imagem
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      httpsAgent
    });
    
    // Salva o arquivo
    const writer = require('fs').createWriteStream(outputPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    return { status: 'downloaded', path: outputPath };
    
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message,
      path: outputPath
    };
  }
}

// Obtém os componentes do Figma por categoria
async function getFigmaComponents() {
  console.log('\n🔍 Obtendo componentes do Figma...');
  
  try {
    // Obtém a estrutura do arquivo
    const { data: fileData } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}`);
    
    // Encontra a página de ícones
    const iconPage = fileData.document.children.find(
      page => page.type === 'CANVAS' && page.name.toLowerCase().includes('icon')
    );
    
    if (!iconPage) {
      throw new Error('Página de ícones não encontrada no documento');
    }
    
    console.log(`\n📄 Página encontrada: ${iconPage.name}`);
    
    // Processa cada categoria
    const categories = {};
    
    for (const category of iconPage.children) {
      const categoryName = category.name;
      const folderName = CATEGORY_MAPPING[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
      
      console.log(`\n📂 Processando categoria: ${categoryName} (${category.id})`);
      
      // Obtém os nós filhos da categoria
      const { data } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}/nodes?ids=${category.id}`);
      const nodes = data.nodes[category.id]?.document?.children || [];
      
      // Filtra apenas componentes
      const components = nodes
        .filter(node => node.type === 'COMPONENT' || node.type === 'INSTANCE')
        .map(node => ({
          id: node.id,
          name: node.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          category: categoryName
        }));
      
      categories[categoryName] = {
        id: category.id,
        folder: folderName,
        components: components,
        count: components.length
      };
      
      console.log(`   ✅ ${components.length} componentes encontrados`);
    }
    
    return categories;
    
  } catch (error) {
    console.error('❌ Erro ao obter componentes do Figma:', error.message);
    throw error;
  }
}

// Função principal
async function main() {
  console.log('🔄 Sincronizando categorias do Figma...');
  console.log('='.repeat(60));
  
  try {
    // 1. Criar todas as pastas necessárias
    console.log('\n📂 Criando pastas de categoria...');
    for (const folder of Object.values(CATEGORY_MAPPING)) {
      await ensureDir(path.join(CONFIG.OUTPUT_DIR, folder));
    }
    
    // 2. Obter componentes do Figma
    const figmaCategories = await getFigmaComponents();
    
    // 3. Baixar ícones faltantes
    console.log('\n⬇️  Baixando ícones faltantes...');
    console.log('='.repeat(60));
    
    let totalDownloaded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const [categoryName, categoryData] of Object.entries(figmaCategories)) {
      console.log(`\n📦 Categoria: ${categoryName}`);
      console.log('-'.repeat(40));
      
      for (const component of categoryData.components) {
        const result = await downloadIcon(component.id, component.name, categoryName);
        
        switch (result.status) {
          case 'downloaded':
            console.log(`   ✅ Baixado: ${component.name}.svg`);
            totalDownloaded++;
            break;
          case 'exists':
            console.log(`   ⏩ Já existe: ${component.name}.svg`);
            totalSkipped++;
            break;
          case 'error':
            console.log(`   ❌ Erro ao baixar ${component.name}.svg: ${result.error}`);
            totalErrors++;
            break;
        }
        
        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // 4. Gerar relatório
    console.log('\n' + '='.repeat(60));
    console.log('📊 Relatório de Sincronização');
    console.log('='.repeat(60));
    
    // Resumo por categoria
    console.log('\n📂 Categorias no Figma:');
    Object.entries(figmaCategories).forEach(([name, data]) => {
      console.log(`   - ${name.padEnd(25)}: ${data.count.toString().padStart(3)} ícones`);
    });
    
    // Resumo de downloads
    console.log('\n📥 Resumo de Downloads:');
    console.log(`   ✅ ${totalDownloaded} novos ícones baixados`);
    console.log(`   ⏩ ${totalSkipped} ícones já existiam`);
    console.log(`   ❌ ${totalErrors} erros durante o download`);
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`📁 Pasta de destino: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();
