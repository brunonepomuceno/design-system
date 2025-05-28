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

// Mapeamento de categorias
const CATEGORIES = {
  // Social
  'facebook': 'social',
  'instagram': 'social',
  'twitter': 'social',
  'youtube': 'social',
  'whatsapp': 'social',
  'linkedin': 'social',
  'comment': 'social',
  'text-message': 'social',
  'verified': 'social',
  
  // Finance
  'pix': 'finance',
  'extract': 'finance',
  'barcode': 'finance',
  'money-exchange': 'finance',
  'key-shining': 'finance',
  'calculator': 'finance',
  'payment': 'finance',
  'receive-money': 'finance',
  'send-money': 'finance',
  'money': 'finance',
  'percentage': 'finance',
  'billing': 'finance',
  'cash-machine': 'finance',
  'wallet': 'finance',
  'credit-card': 'finance',
  'bank': 'finance',
  
  // Technology
  'database': 'technology',
  'data-analysis': 'technology',
  'wifi': 'technology',
  'lock-code': 'technology',
};

// Lista de nós com seus IDs e nomes
const NODES = [
  // Social
  { id: '2180:416', name: 'facebook' },
  { id: '4586:477', name: 'instagram' },
  { id: '2180:418', name: 'twitter' },
  { id: '2180:419', name: 'youtube' },
  { id: '1998:370', name: 'whatsapp' },
  { id: '4586:439', name: 'linkedin' },
  { id: '4197:540', name: 'comment' },
  { id: '2046:342', name: 'text-message' },
  { id: '1998:400', name: 'verified' },
  
  // Finance
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
  { id: '9508:4', name: 'bank' },
  
  // Technology
  { id: '2170:496', name: 'database' },
  { id: '2170:499', name: 'data-analysis' },
  { id: '7887:210', name: 'wifi' },
  { id: '1998:371', name: 'lock-code' },
];

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

// Baixa um ícone específico
async function downloadIcon(node, retryCount = 0) {
  const { id, name } = node;
  const category = CATEGORIES[name] || 'uncategorized';
  const outputDir = path.join(CONFIG.OUTPUT_DIR, category);
  const outputPath = path.join(outputDir, `${name}.svg`);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      return { ...node, status: 'exists', path: outputPath };
    } catch (e) {}
    
    // Garante que o diretório existe
    await ensureDir(outputDir);
    
    console.log(`   - Baixando ${name}.svg...`);
    
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${CONFIG.FILE_KEY}`, {
      params: { ids: id, format: 'svg' }
    });
    
    if (!data.images || !data.images[id]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[id];
    
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
    
    return { ...node, status: 'downloaded', path: outputPath };
    
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < 2) {
      console.log(`   🔄 Tentativa ${retryCount + 1} falhou para ${name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return downloadIcon(node, retryCount + 1);
    }
    
    return { 
      ...node, 
      status: 'error', 
      error: error.message,
      path: outputPath 
    };
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando download de ícones...');
  console.log('='.repeat(60));
  
  try {
    // 1. Criar todas as pastas de categoria necessárias
    console.log('\n📂 Criando pastas de categoria...');
    const uniqueCategories = new Set(Object.values(CATEGORIES));
    for (const category of uniqueCategories) {
      await ensureDir(path.join(CONFIG.OUTPUT_DIR, category));
    }
    
    // 2. Baixar os ícones em lotes
    console.log('\n⬇️  Baixando ícones...');
    console.log('='.repeat(60));
    
    const results = [];
    
    for (let i = 0; i < NODES.length; i += CONFIG.BATCH_SIZE) {
      const batch = NODES.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`\n🔁 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(NODES.length/CONFIG.BATCH_SIZE)}`);
      
      const batchPromises = batch.map(node => downloadIcon(node));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < NODES.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    // 3. Gerar relatório
    const downloaded = results.filter(r => r.status === 'downloaded');
    const exists = results.filter(r => r.status === 'exists');
    const errors = results.filter(r => r.status === 'error');
    
    // Agrupar por categoria
    const byCategory = results.reduce((acc, item) => {
      const category = CATEGORIES[item.name] || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Relatório de Download');
    console.log('='.repeat(60));
    
    // Resumo por categoria
    console.log('\n📂 Ícones por categoria:');
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`   - ${category.padEnd(15)}: ${items.length.toString().padStart(2)} ícones`);
    });
    
    // Resumo de downloads
    console.log('\n📥 Resumo de Downloads:');
    console.log(`   ✅ ${downloaded.length} novos ícones baixados`);
    console.log(`   ⏩ ${exists.length} ícones já existiam`);
    console.log(`   ❌ ${errors.length} erros durante o download`);
    
    if (errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      errors.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}: ${item.error}`);
      });
    }
    
    console.log('\n🎉 Download concluído com sucesso!');
    console.log(`📁 Pasta de destino: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante o download:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();
