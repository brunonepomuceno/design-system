const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const axios = require('axios');

// Configurações
if (!process.env.FIGMA_API_KEY) {
  console.error('❌ Erro: A variável de ambiente FIGMA_API_KEY não está definida.');
  console.error('Por favor, adicione sua chave da API do Figma no arquivo .env');
  process.exit(1);
}

const CONFIG = {
  FIGMA_API_KEY: process.env.FIGMA_API_KEY,
  FILE_KEY: 'pHrUcun54WaijaCoojHoYi',
  ICONS_DIR: path.join(__dirname, '../assets/icons'),
  BATCH_SIZE: 3,
  DELAY_BETWEEN_BATCHES: 1000,
  
  // Mapeamento de categorias para node-ids
  CATEGORIES: {
    'essentials': {
      nodeId: '59:3129',
      icons: [
        // Adicionar ícones específicos se necessário
      ]
    },
    'actions': {
      nodeId: '59:3130',
      icons: [
        { id: '1110:1315', name: 'attach' },
        { id: '3477:534', name: 'download' },
        { id: '3477:535', name: 'upload' },
        { id: '1107:691', name: 'add' },
        { id: '1107:692', name: 'close' }
        // Adicionar mais ícones conforme necessário
      ]
    },
    'vehicles-transport': {
      nodeId: '59:3131',
      icons: [
        { id: '2415:962', name: 'speedometer' },
        { id: '3570:415', name: 'truck-tow' },
        { id: '3570:440', name: 'alert-crash' },
        { id: '1126:880', name: 'navigation-cursor' },
        { id: '1126:881', name: 'box-blocked' }
        // Adicionar mais ícones conforme necessário
      ]
    },
    'technology': {
      nodeId: '59:3132',
      icons: [
        { id: '2091:228', name: 'lock-code' },
        { id: '2170:496', name: 'database' },
        { id: '2170:499', name: 'data-analysis' },
        { id: '7887:210', name: 'wifi' }
      ]
    },
    'social': {
      nodeId: '59:3133',
      icons: [
        { id: '1998:400', name: 'verified' },
        { id: '2180:416', name: 'facebook' },
        { id: '4586:477', name: 'instagram' },
        { id: '2180:418', name: 'twitter' },
        { id: '2180:419', name: 'youtube' },
        { id: '1998:370', name: 'whatsapp' },
        { id: '4197:540', name: 'comment' },
        { id: '4586:439', name: 'linkedin' },
        { id: '2046:342', name: 'text-message' }
      ]
    },
    'finance': {
      nodeId: '59:3135',
      icons: [
        { id: '2091:226', name: 'pix' },
        { id: '2091:227', name: 'extract' },
        { id: '4744:434', name: 'barcode' },
        { id: '6219:965', name: 'money-exchange' },
        { id: '2091:218', name: 'key-shining' },
        { id: '3127:482', name: 'calculator' },
        { id: '3108:2488', name: 'payment' },
        { id: '3549:448', name: 'receive-money' },
        { id: '3549:452', name: 'send-money' },
        { id: '3442:409', name: 'money' },
        { id: '5111:1021', name: 'percentage' },
        { id: '1998:443', name: 'billing' },
        { id: '7887:209', name: 'cash-machine' },
        { id: '9406:2', name: 'wallet' },
        { id: '9412:390', name: 'credit-card' },
        { id: '9508:4', name: 'bank' }
      ]
    }
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

// Lista arquivos em um diretório
async function listFiles(dir) {
  try {
    await fs.access(dir);
    const files = await fs.readdir(dir);
    return files.filter(file => file.endsWith('.svg'));
  } catch (error) {
    return [];
  }
}

// Baixa um ícone específico
async function downloadIcon(icon, category, retryCount = 0) {
  const { id, name } = icon;
  const outputDir = path.join(CONFIG.ICONS_DIR, category);
  const outputPath = path.join(outputDir, `${name}.svg`);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      return { 
        ...icon, 
        status: 'exists', 
        path: outputPath,
        category,
        filename: `${name}.svg`
      };
    } catch (e) {}
    
    console.log(`   - Baixando ${name}.svg...`);
    
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${CONFIG.FILE_KEY}`, {
      params: { 
        ids: id, 
        format: 'svg',
        scale: 1,
        svg_include_id: true,
        use_absolute_bounds: true
      }
    });
    
    if (!data.images || !data.images[id]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[id];
    
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
    
    console.log(`   ✅ ${name}.svg baixado com sucesso`);
    return { 
      ...icon, 
      status: 'downloaded', 
      path: outputPath,
      category,
      filename: `${name}.svg`
    };
    
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < 2) {
      console.log(`   🔄 Tentativa ${retryCount + 1} falhou para ${name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return downloadIcon(icon, category, retryCount + 1);
    }
    
    console.error(`   ❌ Erro ao baixar ${name}: ${error.message}`);
    return { 
      ...icon, 
      status: 'error', 
      error: error.message,
      path: outputPath,
      category,
      filename: `${name}.svg`
    };
  }
}

// Processa uma categoria de ícones
async function processCategory(categoryName, categoryConfig) {
  console.log(`\n📂 Processando categoria: ${categoryName}`);
  console.log('-' + '-'.repeat(50));
  
  try {
    const { icons } = categoryConfig;
    
    if (!icons || icons.length === 0) {
      console.log('   ℹ️  Nenhum ícone definido para esta categoria');
      return [];
    }
    
    console.log(`   🔍 Verificando ${icons.length} ícones...`);
    
    // Baixa os ícones em lotes
    const results = [];
    
    for (let i = 0; i < icons.length; i += CONFIG.BATCH_SIZE) {
      const batch = icons.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`\n🔁 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(icons.length/CONFIG.BATCH_SIZE)}`);
      
      const batchPromises = batch.map(icon => downloadIcon(icon, categoryName));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < icons.length) {
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
  
  // Adiciona os ícones de cada categoria
  for (const [category, results] of Object.entries(categories)) {
    // Filtra apenas os resultados válidos (que não são erros)
    const validResults = results.filter(r => r.status !== 'error');
    
    // Adiciona ao resumo por categoria
    indexData.categories[category] = validResults.length;
    indexData.totalIcons += validResults.length;
    
    // Adiciona os ícones
    indexData.icons.push(
      ...validResults.map(icon => ({
        name: icon.name,
        category,
        path: path.relative(CONFIG.ICONS_DIR, icon.path).replace(/\\/g, '/'),
        status: icon.status,
        nodeId: icon.id
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
  console.log('🔄 Iniciando sincronização de todos os ícones...');
  console.log('='.repeat(70));
  
  try {
    // Cria o diretório de ícones se não existir
    await ensureDir(CONFIG.ICONS_DIR);
    
    // Processa cada categoria
    const results = {};
    
    for (const [categoryName, categoryConfig] of Object.entries(CONFIG.CATEGORIES)) {
      const categoryResults = await processCategory(categoryName, categoryConfig);
      results[categoryName] = categoryResults;
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
      
      if (errors > 0) {
        const errorIcons = icons.filter(i => i.status === 'error');
        console.log('   Erros:');
        errorIcons.forEach(icon => {
          console.log(`     - ${icon.name}: ${icon.error}`);
        });
      }
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
