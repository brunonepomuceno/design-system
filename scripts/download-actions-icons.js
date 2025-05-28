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
  OUTPUT_DIR: path.join(__dirname, '../assets/icons/actions'),
  BATCH_SIZE: 3,
  DELAY_BETWEEN_BATCHES: 1000,
};

// Lista de nós de ações
const ACTIONS_NODES = [
  // Navegação
  { id: '2230:901', name: 'chevron-down' },
  { id: '2230:902', name: 'chevron-up' },
  { id: '3378:520', name: 'expand' },
  { id: '3378:539', name: 'shrink' },
  
  // Visualização
  { id: '1107:686', name: 'view-show' },
  { id: '1107:687', name: 'view-hide' },
  { id: '4459:454', name: 'view-details' },
  { id: '1107:693', name: 'search' },
  { id: '1107:690', name: 'edit' },
  { id: '1107:689', name: 'filter' },
  
  // Ações básicas
  { id: '1118:338', name: 'add-circle' },
  { id: '1110:1316', name: 'add-square' },
  { id: '8692:5', name: 'minus' },
  { id: '1110:1309', name: 'cancel' },
  { id: '1110:1319', name: 'trash' },
  
  // Área de transferência
  { id: '1118:330', name: 'copy' },
  { id: '1118:335', name: 'paste' },
  
  // Mídia
  { id: '4007:472', name: 'play' },
  { id: '4004:441', name: 'pause' },
  
  // Notificações
  { id: '1110:1324', name: 'notification' },
  { id: '1110:1325', name: 'notification-off' },
  { id: '1110:1326', name: 'notification-on' },
  
  // Usuários
  { id: '4165:436', name: 'user-add' },
  { id: '4221:409', name: 'user-remove' },
  
  // Favoritos
  { id: '2261:896', name: 'favorite-add' },
  
  // Utilitários
  { id: '1110:1311', name: 'share' },
  { id: '1110:1317', name: 'information' },
  { id: '4479:470', name: 'save' },
  { id: '1110:1321', name: 'logout' },
  { id: '1110:1322', name: 'logout-alt' },
  { id: '1110:1312', name: 'settings' }
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
  console.log('🚀 Iniciando download de ícones de ações...');
  console.log('='.repeat(70));
  
  try {
    // 1. Criar o diretório de saída
    console.log('\n📂 Criando pasta de destino...');
    await ensureDir(CONFIG.OUTPUT_DIR);
    
    // 2. Baixar os ícones em lotes
    console.log('\n⬇️  Baixando ícones...');
    console.log('='.repeat(70));
    
    const results = [];
    
    for (let i = 0; i < ACTIONS_NODES.length; i += CONFIG.BATCH_SIZE) {
      const batch = ACTIONS_NODES.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`\n🔁 Processando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1} de ${Math.ceil(ACTIONS_NODES.length/CONFIG.BATCH_SIZE)}`);
      
      const batchPromises = batch.map(node => downloadIcon(node));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < ACTIONS_NODES.length) {
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
