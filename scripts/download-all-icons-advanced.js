const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const axios = require('axios');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

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
  BATCH_SIZE: 5, // Número de downloads simultâneos
  DELAY_BETWEEN_BATCHES: 2000, // 2 segundos entre lotes
  MAX_RETRIES: 3, // Número de tentativas por ícone
  FORMAT: 'svg', // Formato dos ícones (svg, png, jpg)
  SCALE: 1, // Escala para formatos raster (png, jpg)
  USE_CATEGORY_FOLDERS: true, // Organizar em pastas por categoria
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
  timeout: 30000 // 30 segundos de timeout
});

// Mapeamento de categorias para nomes de pastas amigáveis
const CATEGORY_MAP = {
  'Essentials': 'essentials',
  'Actions': 'actions',
  'Vehicles & Transportation': 'transport',
  'Technology': 'technology',
  'Social': 'social',
  'Finance': 'finance',
};

// Cache para armazenar os componentes já processados
const processedIcons = new Set();

/**
 * Cria um diretório se ele não existir
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error(`Erro ao criar diretório ${dir}:`, err);
      throw err;
    }
  }
}

/**
 * Baixa um arquivo e salva localmente
 */
async function downloadFile(url, filePath) {
  const writer = createWriteStream(filePath);
  
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      httpsAgent,
      timeout: 60000 // 60 segundos
    });
    
    await pipeline(response.data, writer);
    return true;
  } catch (error) {
    // Remove arquivo parcialmente baixado em caso de erro
    try { await fs.unlink(filePath); } catch (e) {}
    throw error;
  }
}

/**
 * Baixa um ícone específico com tratamento de erros e retry
 */
async function downloadIcon(icon, outputPath, retryCount = 0) {
  const { id, name, category } = icon;
  const filePath = path.join(outputPath, `${name}.${CONFIG.FORMAT}`);
  
  // Pula se o arquivo já existir
  try {
    await fs.access(filePath);
    return { ...icon, status: 'skipped', path: filePath };
  } catch (e) {}
  
  try {
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${CONFIG.FILE_KEY}`, {
      params: {
        ids: id,
        format: CONFIG.FORMAT,
        scale: CONFIG.FORMAT === 'svg' ? undefined : CONFIG.SCALE
      }
    });
    
    if (!data.images || !data.images[id]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[id];
    if (!imageUrl) {
      throw new Error('URL da imagem está vazia');
    }
    
    // Baixa e salva a imagem
    await downloadFile(imageUrl, filePath);
    
    // Verifica se o arquivo foi baixado corretamente
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      await fs.unlink(filePath);
      throw new Error('Arquivo vazio');
    }
    
    return { ...icon, status: 'success', path: filePath };
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`Tentativa ${retryCount + 1} falhou para ${name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Backoff exponencial
      return downloadIcon(icon, outputPath, retryCount + 1);
    }
    
    return { 
      ...icon, 
      status: 'error', 
      error: error.message,
      path: filePath 
    };
  }
}

/**
 * Processa uma categoria de ícones
 */
async function processCategory(category) {
  const { id: categoryId, name: categoryName } = category;
  const folderName = CATEGORY_MAP[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
  const outputPath = path.join(CONFIG.OUTPUT_DIR, folderName);
  
  console.log(`\n📂 Processando categoria: ${categoryName}`);
  console.log(`📁 Pasta de saída: ${outputPath}`);
  
  // Cria o diretório da categoria
  await ensureDir(outputPath);
  
  // Obtém os nós filhos da categoria
  const { data } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}/nodes?ids=${categoryId}`);
  const nodes = data.nodes[categoryId]?.document?.children || [];
  
  if (nodes.length === 0) {
    console.log(`⚠️  Nenhum ícone encontrado na categoria ${categoryName}`);
    return [];
  }
  
  // Filtra apenas componentes e instâncias
  const icons = nodes
    .filter(node => {
      const isComponent = node.type === 'COMPONENT' || node.type === 'INSTANCE';
      const isNotProcessed = !processedIcons.has(node.id);
      
      if (isComponent && isNotProcessed) {
        processedIcons.add(node.id);
        return true;
      }
      
      return false;
    })
    .map(node => ({
      id: node.id,
      name: node.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      category: categoryName,
      type: node.type
    }));
  
  console.log(`🔍 Encontrados ${icons.length} ícones na categoria ${categoryName}`);
  
  // Processa os ícones em lotes
  const results = [];
  
  for (let i = 0; i < icons.length; i += CONFIG.BATCH_SIZE) {
    const batch = icons.slice(i, i + CONFIG.BATCH_SIZE);
    console.log(`\n🔄 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(icons.length/CONFIG.BATCH_SIZE)}`);
    
    const batchPromises = batch.map(icon => 
      downloadIcon(icon, outputPath)
        .then(result => {
          console.log(`   ${result.status === 'success' ? '✅' : '❌'} ${result.name}.${CONFIG.FORMAT}`);
          return result;
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pequena pausa entre lotes para evitar sobrecarregar a API
    if (i + CONFIG.BATCH_SIZE < icons.length) {
      console.log(`⏳ Aguardando ${CONFIG.DELAY_BETWEEN_BATCHES/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
}

/**
 * Gera um arquivo de índice com todos os ícones baixados
 */
async function generateIndexFile(results) {
  const indexPath = path.join(CONFIG.OUTPUT_DIR, 'index.json');
  const indexData = {
    generatedAt: new Date().toISOString(),
    totalIcons: results.length,
    categories: {},
    icons: results.map(icon => ({
      name: icon.name,
      category: icon.category,
      path: path.relative(CONFIG.OUTPUT_DIR, icon.path).replace(/\\/g, '/'),
      status: icon.status,
      error: icon.error
    }))
  };
  
  // Agrupa por categoria
  results.forEach(icon => {
    if (!indexData.categories[icon.category]) {
      indexData.categories[icon.category] = [];
    }
    indexData.categories[icon.category].push(icon.name);
  });
  
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`\n📝 Arquivo de índice gerado: ${indexPath}`);
  
  return indexPath;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando download de ícones do Figma');
  console.log('='.repeat(60));
  
  try {
    // Obtém a estrutura do documento
    console.log('\n📋 Obtendo estrutura do documento...');
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
    const allResults = [];
    
    for (const category of iconPage.children) {
      const results = await processCategory({
        id: category.id,
        name: category.name
      });
      
      allResults.push(...results);
    }
    
    // Gera o arquivo de índice
    await generateIndexFile(allResults);
    
    // Gera relatório
    const successful = allResults.filter(r => r.status === 'success');
    const skipped = allResults.filter(r => r.status === 'skipped');
    const failed = allResults.filter(r => r.status === 'error');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Relatório de Download');
    console.log('='.repeat(60));
    console.log(`✅ ${successful.length} ícones baixados com sucesso`);
    console.log(`⏩ ${skipped.length} ícones já existiam e foram pulados`);
    
    if (failed.length > 0) {
      console.log(`❌ ${failed.length} ícones falharam:`);
      failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
      
      // Salva a lista de falhas em um arquivo
      const errorLogPath = path.join(CONFIG.OUTPUT_DIR, 'errors.json');
      await fs.writeFile(errorLogPath, JSON.stringify(failed, null, 2));
      console.log(`\n📝 Lista de erros salva em: ${errorLogPath}`);
    }
    
    console.log('\n🎉 Processo concluído com sucesso!');
    console.log(`📁 Pasta de destino: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante o processo:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();
