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
  OUTPUT_DIR: path.join(__dirname, '../assets/icons/finance'),
  BATCH_SIZE: 3,
  DELAY_BETWEEN_BATCHES: 1000,
  
  // Mapeamento de nomes para node-ids da categoria Finance
  FINANCE_ICONS: [
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

// Baixa um ícone específico
async function downloadIcon(icon, retryCount = 0) {
  const { id, name } = icon;
  const outputPath = path.join(CONFIG.OUTPUT_DIR, `${name}.svg`);
  
  try {
    // Verifica se o arquivo já existe
    try {
      await fs.access(outputPath);
      console.log(`   ⏩ ${name}.svg já existe`);
      return { ...icon, status: 'exists', path: outputPath };
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
    return { ...icon, status: 'downloaded', path: outputPath };
    
  } catch (error) {
    // Tenta novamente se ainda houver tentativas
    if (retryCount < 2) {
      console.log(`   🔄 Tentativa ${retryCount + 1} falhou para ${name}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return downloadIcon(icon, retryCount + 1);
    }
    
    console.error(`   ❌ Erro ao baixar ${name}: ${error.message}`);
    return { 
      ...icon, 
      status: 'error', 
      error: error.message,
      path: outputPath 
    };
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando download de ícones financeiros...');
  console.log('='.repeat(70));
  
  try {
    // 1. Criar o diretório de saída
    console.log('\n📂 Criando pasta de destino...');
    await ensureDir(CONFIG.OUTPUT_DIR);
    
    // 2. Baixar os ícones em lotes
    console.log('\n⬇️  Baixando ícones...');
    console.log('='.repeat(70));
    
    const results = [];
    
    for (let i = 0; i < CONFIG.FINANCE_ICONS.length; i += CONFIG.BATCH_SIZE) {
      const batch = CONFIG.FINANCE_ICONS.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`\n🔁 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(CONFIG.FINANCE_ICONS.length/CONFIG.BATCH_SIZE)}`);
      
      const batchPromises = batch.map(icon => downloadIcon(icon));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < CONFIG.FINANCE_ICONS.length) {
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
