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

  FIGMA_API_KEY: 'process.env.FIGMA_API_KEY', // Usando a chave fornecida
  FILE_KEY: 'pHrUcun54WaijaCoojHoYi',
  OUTPUT_DIR: path.join(__dirname, '../assets/icons'),
};

// Mapeamento de categorias para nomes de pastas
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
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error(`❌ Erro ao criar pasta ${dir}:`, err);
      throw err;
    }
    return false;
  }
}

// Obtém todos os componentes do arquivo Figma
async function getAllComponents() {
  try {
    console.log('🔍 Buscando componentes no arquivo Figma...');
    
    // Primeiro, obtém a lista de componentes
    const { data: componentsData } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}/components`);
    
    if (!componentsData.meta || !componentsData.meta.components) {
      console.log('Nenhum componente encontrado no arquivo.');
      return [];
    }
    
    console.log(`✅ Encontrados ${componentsData.meta.components.length} componentes`);
    return componentsData.meta.components;
    
  } catch (error) {
    console.error('❌ Erro ao buscar componentes:', error.response?.data || error.message);
    throw error;
  }
}

// Baixa um ícone específico
async function downloadIcon(component, retryCount = 0) {
  const { name, file_key, node_id } = component;
  const category = component.containing_frame?.name || 'uncategorized';
  const folderName = CATEGORY_MAPPING[category] || category.toLowerCase().replace(/\s+/g, '-');
  const outputDir = path.join(CONFIG.OUTPUT_DIR, folderName);
  const fileName = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.svg`;
  const outputPath = path.join(outputDir, fileName);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      return { ...component, status: 'exists', path: outputPath };
    } catch (e) {}
    
    // Garante que o diretório existe
    await ensureDir(outputDir);
    
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${file_key}`, {
      params: { ids: node_id, format: 'svg' }
    });
    
    if (!data.images || !data.images[node_id]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[node_id];
    
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
    
    return { ...component, status: 'downloaded', path: outputPath };
    
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < 2) {
      console.log(`   🔄 Tentativa ${retryCount + 1} falhou para ${name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return downloadIcon(component, retryCount + 1);
    }
    
    return { 
      ...component, 
      status: 'error', 
      error: error.message,
      path: outputPath 
    };
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando sincronização de componentes do Figma');
  console.log('='.repeat(60));
  
  try {
    // 1. Criar todas as pastas de categoria
    console.log('\n📂 Criando pastas de categoria...');
    for (const folder of Object.values(CATEGORY_MAPPING)) {
      await ensureDir(path.join(CONFIG.OUTPUT_DIR, folder));
    }
    
    // 2. Obter todos os componentes do arquivo
    const components = await getAllComponents();
    
    if (components.length === 0) {
      console.log('\n❌ Nenhum componente encontrado no arquivo Figma.');
      console.log('   Verifique se a chave do arquivo está correta e se existem componentes publicados.');
      return;
    }
    
    // 3. Baixar os componentes
    console.log('\n⬇️  Baixando componentes...');
    console.log('='.repeat(60));
    
    const results = [];
    const batchSize = 3;
    
    for (let i = 0; i < components.length; i += batchSize) {
      const batch = components.slice(i, i + batchSize);
      console.log(`\n🔁 Processando lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(components.length/batchSize)}`);
      
      const batchPromises = batch.map(component => {
        console.log(`   - ${component.name}...`);
        return downloadIcon(component);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + batchSize < components.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 4. Gerar relatório
    const downloaded = results.filter(r => r.status === 'downloaded');
    const exists = results.filter(r => r.status === 'exists');
    const errors = results.filter(r => r.status === 'error');
    
    // Agrupar por categoria
    const byCategory = results.reduce((acc, item) => {
      const category = item.containing_frame?.name || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Relatório de Sincronização');
    console.log('='.repeat(60));
    
    // Resumo por categoria
    console.log('\n📂 Componentes por categoria:');
    Object.entries(byCategory).forEach(([category, items]) => {
      const folder = CATEGORY_MAPPING[category] || category.toLowerCase().replace(/\s+/g, '-');
      console.log(`   - ${category.padEnd(25)}: ${items.length.toString().padStart(3)} itens (${folder}/)`);
    });
    
    // Resumo de downloads
    console.log('\n📥 Resumo de Downloads:');
    console.log(`   ✅ ${downloaded.length} novos componentes baixados`);
    console.log(`   ⏩ ${exists.length} componentes já existiam`);
    console.log(`   ❌ ${errors.length} erros durante o download`);
    
    if (errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      errors.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}: ${item.error}`);
      });
    }
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`📁 Pasta de destino: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();
