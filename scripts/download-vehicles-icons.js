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
  OUTPUT_DIR: path.join(__dirname, '../assets/icons/vehicles-transport'),
  BATCH_SIZE: 3,
  DELAY_BETWEEN_BATCHES: 1000,
};

// Lista de nós de veículos e transporte
const VEHICLE_NODES = [
  // Caminhões
  { id: '1126:875', name: 'truck' },
  { id: '1126:874', name: 'truck-cargo' },
  { id: '1126:876', name: 'truck-low-grade' },
  { id: '3570:415', name: 'truck-tow' },
  
  // Ícones de transporte
  { id: '1126:877', name: 'box' },
  { id: '1126:881', name: 'box-blocked' },
  { id: '1126:882', name: 'gas-pump' },
  { id: '1126:883', name: 'trip' },
  { id: '1126:884', name: 'distance' },
  { id: '1126:885', name: 'toll' },
  { id: '1126:878', name: 'map-pin' },
  { id: '1126:879', name: 'travel-map' },
  { id: '1126:880', name: 'navigation-cursor' },
  
  // Manutenção e serviços
  { id: '7887:205', name: 'tire-shop' },
  { id: '7887:206', name: 'mechanical-workshop' },
  { id: '7887:207', name: 'oil-change' },
  { id: '7887:244', name: 'truck-washing' },
  { id: '7887:116', name: 'parking' },
  
  // Outros ícones de transporte
  { id: '2170:503', name: 'shipment-tax' },
  { id: '2415:959', name: 'gas-can' },
  { id: '2415:962', name: 'speedometer' },
  { id: '3570:440', name: 'alert-crash' },
  { id: '3570:468', name: 'alternative-vehicle' },
  { id: '8960:393', name: 'location-target' }
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

// Baixa um ícone específico
async function downloadIcon(node, retryCount = 0) {
  const { id, name } = node;
  const outputPath = path.join(CONFIG.OUTPUT_DIR, `${name}.svg`);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      console.log(`   ⏩ ${name}.svg já existe`);
      return { ...node, status: 'exists', path: outputPath };
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
    return { ...node, status: 'downloaded', path: outputPath };
    
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < 2) {
      console.log(`   🔄 Tentativa ${retryCount + 1} falhou para ${name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return downloadIcon(node, retryCount + 1);
    }
    
    console.error(`   ❌ Erro ao baixar ${name}: ${error.message}`);
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
  console.log('🚀 Iniciando download de ícones de veículos e transporte...');
  console.log('='.repeat(70));
  
  try {
    // 1. Criar o diretório de saída
    console.log('\n📂 Criando pasta de destino...');
    await ensureDir(CONFIG.OUTPUT_DIR);
    
    // 2. Baixar os ícones em lotes
    console.log('\n⬇️  Baixando ícones...');
    console.log('='.repeat(70));
    
    const results = [];
    
    for (let i = 0; i < VEHICLE_NODES.length; i += CONFIG.BATCH_SIZE) {
      const batch = VEHICLE_NODES.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`\n🔁 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(VEHICLE_NODES.length/CONFIG.BATCH_SIZE)}`);
      
      const batchPromises = batch.map(node => downloadIcon(node));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < VEHICLE_NODES.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    // 3. Gerar relatório
    const downloaded = results.filter(r => r.status === 'downloaded');
    const exists = results.filter(r => r.status === 'exists');
    const errors = results.filter(r => r.status === 'error');
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 Relatório de Download');
    console.log('='.repeat(70));
    
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
