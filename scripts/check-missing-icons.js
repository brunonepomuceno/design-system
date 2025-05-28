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
  ICONS_DIR: path.join(__dirname, '../assets/icons'),
  BATCH_SIZE: 3,
  DELAY_BETWEEN_BATCHES: 1000,
  
  // Mapeamento de categorias para node-ids
  CATEGORIES: {
    'finance': [
      '2091:226', // Pix
      '2091:227', // Extract
      '4744:434', // Bar code
      '6219:965', // Money exchange
      '2091:218', // Key shining
      '3127:482', // Calculator
      '3108:2488', // Payment
      '3549:448', // Receive money
      '3549:452', // Send money
      '3442:409', // Money
      '5111:1021', // Percentage
      '1998:443', // Billing
      '7887:209', // Cash machine
      '9406:2',   // Wallet
      '9412:390', // Credit card
      '9508:4'    // Bank
    ],
    'technology': [
      '2170:496', // Database
      '2170:499', // Data analysis
      '7887:210'  // WiFi internet
    ],
    'social': [
      '1998:400', // Verified
      '2180:416', // Facebook
      '4586:477', // Instagram
      '2180:418', // Twitter
      '2180:419', // Youtube
      '1998:370', // Whatsapp
      '4197:540', // Comment
      '4586:439', // Linkedin
      '2046:342'  // Text message
    ]
  }
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
    console.log(`✅ Pasta criada: ${path.relative(process.cwd(), dir)}`);
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error(`❌ Erro ao criar pasta ${dir}:`, err);
      throw err;
    }
    return false;
  }
}

// Obtém os detalhes de um nó específico
async function getNodeDetails(nodeId) {
  try {
    const { data } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}/nodes`, {
      params: { ids: nodeId }
    });
    
    const node = data.nodes[nodeId.replace(':', '-')]?.document;
    if (!node) {
      throw new Error(`Nó ${nodeId} não encontrado`);
    }
    
    return {
      id: nodeId,
      name: node.name,
      description: node.description || '',
      type: node.type
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do nó ${nodeId}:`, error.message);
    return null;
  }
}

// Baixa um ícone específico
async function downloadIcon(node, category, retryCount = 0) {
  const filename = `${node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
  const outputDir = path.join(CONFIG.ICONS_DIR, category);
  const outputPath = path.join(outputDir, filename);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      return { 
        ...node, 
        status: 'exists', 
        path: outputPath,
        category,
        filename
      };
    } catch (e) {}
    
    console.log(`   - Baixando ${filename}...`);
    
    // Obtém a URL da imagem
    const { data: imageData } = await figmaApi.get(`/images/${CONFIG.FILE_KEY}`, {
      params: { 
        ids: node.id, 
        format: 'svg',
        scale: 1,
        svg_include_id: true,
        use_absolute_bounds: true
      }
    });
    
    if (!imageData.images || !imageData.images[node.id]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = imageData.images[node.id];
    
    if (!imageUrl) {
      throw new Error('URL da imagem vazia');
    }
    
    // Cria o diretório se não existir
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
    
    console.log(`   ✅ ${filename} baixado com sucesso`);
    return { 
      ...node, 
      status: 'downloaded', 
      path: outputPath,
      category,
      filename
    };
    
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < 2) {
      console.log(`   🔄 Tentativa ${retryCount + 1} falhou para ${node.name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return downloadIcon(node, category, retryCount + 1);
    }
    
    console.error(`   ❌ Erro ao baixar ${node.name}: ${error.message}`);
    return { 
      ...node, 
      status: 'error', 
      error: error.message,
      path: outputPath,
      category,
      filename
    };
  }
}

// Processa uma categoria de ícones
async function processCategory(categoryName, nodeIds) {
  console.log(`\n📂 Processando categoria: ${categoryName}`);
  console.log('-' + '-'.repeat(50));
  
  try {
    // Obtém os detalhes de cada nó
    const nodes = [];
    
    for (const nodeId of nodeIds) {
      const node = await getNodeDetails(nodeId);
      if (node) {
        nodes.push(node);
      } else {
        console.log(`   ⚠️  Nó ${nodeId} não encontrado`);
      }
    }
    
    console.log(`   🔍 Encontrados ${nodes.length} ícones no Figma`);
    
    // Baixa os ícones em lotes
    const results = [];
    
    for (let i = 0; i < nodes.length; i += CONFIG.BATCH_SIZE) {
      const batch = nodes.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`\n🔁 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(nodes.length/CONFIG.BATCH_SIZE)}`);
      
      const batchPromises = batch.map(node => downloadIcon(node, categoryName));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < nodes.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ Erro ao processar categoria ${categoryName}:`, error.message);
    return [];
  }
}

// Gera o arquivo index.json
async function generateIndexFile(categories) {
  const indexData = {
    generatedAt: new Date().toISOString(),
    totalIcons: 0,
    categories: {},
    icons: []
  };
  
  // Conta os ícones por categoria
  for (const [category, results] of Object.entries(categories)) {
    const validIcons = results.filter(icon => icon.status !== 'error');
    indexData.categories[category] = validIcons.length;
    indexData.totalIcons += validIcons.length;
    
    // Adiciona os ícones ao array
    indexData.icons.push(
      ...validIcons.map(icon => ({
        name: icon.filename.replace('.svg', ''),
        category,
        path: path.relative(CONFIG.ICONS_DIR, icon.path).replace(/\\/g, '/'),
        status: icon.status
      }))
    );
  }
  
  // Ordena os ícones por categoria e nome
  indexData.icons.sort((a, b) => {
    if (a.category === b.category) {
      return a.name.localeCompare(b.name);
    }
    return a.category.localeCompare(b.category);
  });
  
  // Salva o arquivo
  const indexPath = path.join(CONFIG.ICONS_DIR, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
  
  console.log(`\n📝 Arquivo de índice gerado: ${path.relative(process.cwd(), indexPath)}`);
  
  return indexData;
}

// Função principal
async function main() {
  console.log('🔄 Iniciando verificação de ícones...');
  console.log('='.repeat(70));
  
  try {
    // Cria o diretório de ícones se não existir
    await ensureDir(CONFIG.ICONS_DIR);
    
    // Processa cada categoria
    const results = {};
    
    for (const [category, nodeIds] of Object.entries(CONFIG.CATEGORIES)) {
      const categoryResults = await processCategory(category, nodeIds);
      results[category] = categoryResults;
    }
    
    // Gera o arquivo de índice
    const indexData = await generateIndexFile(results);
    
    // Exibe o relatório
    console.log('\n' + '='.repeat(70));
    console.log('📊 Relatório de Sincronização');
    console.log('='.repeat(70));
    
    let totalDownloaded = 0;
    let totalExists = 0;
    let totalErrors = 0;
    
    for (const [category, icons] of Object.entries(results)) {
      const downloaded = icons.filter(i => i.status === 'downloaded').length;
      const exists = icons.filter(i => i.status === 'exists').length;
      const errors = icons.filter(i => i.status === 'error').length;
      
      totalDownloaded += downloaded;
      totalExists += exists;
      totalErrors += errors;
      
      console.log(`\n📁 ${category.toUpperCase()} (${icons.length} ícones):`);
      console.log(`   ✅ ${downloaded} novos ícones baixados`);
      console.log(`   ⏩ ${exists} ícones já existiam`);
      console.log(`   ❌ ${errors} erros durante o download`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO GERAL:');
    console.log(`   📦 Total de categorias: ${Object.keys(results).length}`);
    console.log(`   ✅ ${totalDownloaded} novos ícones baixados`);
    console.log(`   ⏩ ${totalExists} ícones já existiam`);
    console.log(`   ❌ ${totalErrors} erros durante o download`);
    console.log(`   📝 Total de ícones no índice: ${indexData.totalIcons}`);
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();
