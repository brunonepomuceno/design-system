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

// Lista de ícones com seus IDs e categorias
const ICONS = [
  // Social
  { id: '2180:416', name: 'facebook', category: 'social' },
  { id: '4586:477', name: 'instagram', category: 'social' },
  { id: '2180:418', name: 'twitter', category: 'social' },
  { id: '2180:419', name: 'youtube', category: 'social' },
  { id: '1998:370', name: 'whatsapp', category: 'social' },
  { id: '4586:439', name: 'linkedin', category: 'social' },
  { id: '4197:540', name: 'comment', category: 'social' },
  { id: '2046:342', name: 'text-message', category: 'social' },
  { id: '1998:400', name: 'verified', category: 'social' },
  
  // Finance
  { id: '2091:226', name: 'pix', category: 'finance' },
  { id: '2091:227', name: 'extract', category: 'finance' },
  { id: '4744:434', name: 'barcode', category: 'finance' },
  { id: '6219:965', name: 'money-exchange', category: 'finance' },
  { id: '2091:218', name: 'key-shining', category: 'finance' },
  { id: '3127:482', name: 'calculator', category: 'finance' },
  { id: '3108:2488', name: 'payment', category: 'finance' },
  { id: '3549:448', name: 'receive-money', category: 'finance' },
  { id: '3549:452', name: 'send-money', category: 'finance' },
  { id: '3442:409', name: 'money', category: 'finance' },
  { id: '5111:1021', name: 'percentage', category: 'finance' },
  { id: '1998:443', name: 'billing', category: 'finance' },
  { id: '7887:209', name: 'cash-machine', category: 'finance' },
  { id: '9406:2', name: 'wallet', category: 'finance' },
  { id: '9412:390', name: 'credit-card', category: 'finance' },
  { id: '9508:4', name: 'bank', category: 'finance' },
  
  // Technology
  { id: '2170:496', name: 'database', category: 'technology' },
  { id: '2170:499', name: 'data-analysis', category: 'technology' },
  { id: '7887:210', name: 'wifi', category: 'technology' },
  { id: '1998:371', name: 'lock-code', category: 'technology' },
];

// Cria diretório se não existir
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Baixa um ícone
async function downloadIcon(icon) {
  const outputDir = path.join(CONFIG.OUTPUT_DIR, icon.category);
  await ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, `${icon.name}.svg`);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      return { ...icon, status: 'skipped' };
    } catch (e) {}
    
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${CONFIG.FILE_KEY}`, {
      params: { ids: icon.id, format: 'svg' }
    });
    
    if (!data.images || !data.images[icon.id]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[icon.id];
    
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
    
    return { ...icon, status: 'success' };
    
  } catch (error) {
    return { 
      ...icon, 
      status: 'error', 
      error: error.message 
    };
  }
}

// Processa os ícones em lotes
async function processIcons() {
  console.log('🚀 Iniciando download de ícones...\n');
  
  const results = [];
  
  for (let i = 0; i < ICONS.length; i += CONFIG.BATCH_SIZE) {
    const batch = ICONS.slice(i, i + CONFIG.BATCH_SIZE);
    console.log(`Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(ICONS.length/CONFIG.BATCH_SIZE)}`);
    
    const batchPromises = batch.map(icon => {
      console.log(`- Baixando ${icon.name}.svg...`);
      return downloadIcon(icon);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pequena pausa entre lotes
    if (i + CONFIG.BATCH_SIZE < ICONS.length) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
}

// Gera relatório
function generateReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Relatório de Download');
  console.log('='.repeat(50));
  
  const byStatus = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`- ${status}: ${count} ícones`);
  });
  
  const failed = results.filter(r => r.status === 'error');
  if (failed.length > 0) {
    console.log('\n❌ Erros encontrados:');
    failed.forEach(item => {
      console.log(`  - ${item.name}: ${item.error}`);
    });
  }
  
  console.log('\n🎉 Processo concluído!');
  console.log(`📁 Pasta de destino: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
}

// Executa o script
async function main() {
  try {
    await ensureDir(CONFIG.OUTPUT_DIR);
    const results = await processIcons();
    generateReport(results);
  } catch (error) {
    console.error('❌ Erro no processo principal:', error.message);
  }
}

main();
