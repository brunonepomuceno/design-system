const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const axios = require('axios');

// Configurações
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;';
const FILE_KEY = 'pHrUcun54WaijaCoojHoYi';
const OUTPUT_DIR = path.join(__dirname, '../assets/icons');

// Configura o agente HTTPS para ignorar erros de certificado
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Configura o axios
const figmaApi = axios.create({
  baseURL: 'https://api.figma.com/v1',
  headers: { 'X-Figma-Token': FIGMA_API_KEY },
  httpsAgent: httpsAgent
});

// Lista completa de ícones com seus IDs e nomes de arquivo
const ALL_ICONS = [
  // Redes Sociais
  { id: '2180:416', name: 'facebook.svg' },
  { id: '4586:477', name: 'instagram.svg' },
  { id: '2180:418', name: 'twitter.svg' },
  { id: '2180:419', name: 'youtube.svg' },
  { id: '1998:370', name: 'whatsapp.svg' },
  { id: '4586:439', name: 'linkedin.svg' },
  
  // Financeiros
  { id: '2091:226', name: 'pix.svg' },
  { id: '2091:227', name: 'extract.svg' },
  { id: '4744:434', name: 'barcode.svg' },
  { id: '6219:965', name: 'money-exchange.svg' },
  { id: '2091:218', name: 'key-shining.svg' },
  { id: '3127:482', name: 'calculator.svg' },
  { id: '3108:2488', name: 'payment.svg' },
  { id: '3549:448', name: 'receive-money.svg' },
  { id: '3549:452', name: 'send-money.svg' },
  { id: '3442:409', name: 'money.svg' },
  { id: '5111:1021', name: 'percentage.svg' },
  { id: '1998:443', name: 'billing.svg' },
  { id: '7887:209', name: 'cash-machine.svg' },
  { id: '9406:2', name: 'wallet.svg' },
  { id: '9412:390', name: 'credit-card.svg' },
  { id: '9508:4', name: 'bank.svg' },
  
  // Tecnologia
  { id: '2170:496', name: 'database.svg' },
  { id: '2170:499', name: 'data-analysis.svg' },
  { id: '7887:210', name: 'wifi.svg' },
  
  // Geral
  { id: '1998:400', name: 'verified.svg' },
  { id: '4197:540', name: 'comment.svg' },
  { id: '2046:342', name: 'text-message.svg' }
];

// Função para baixar um único ícone
async function downloadIcon(nodeId, fileName) {
  try {
    console.log(`Baixando ${fileName}...`);
    
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${FILE_KEY}?ids=${nodeId}&format=svg`);
    
    if (!data.images || !data.images[nodeId]) {
      throw new Error('URL da imagem não encontrada');
    }
    
    const imageUrl = data.images[nodeId];
    
    // Baixa a imagem
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      httpsAgent: httpsAgent
    });
    
    // Garante que o diretório existe
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Salva o arquivo
    await fs.writeFile(path.join(OUTPUT_DIR, fileName), response.data);
    
    console.log(`✅ ${fileName} baixado com sucesso!`);
    return { success: true, fileName };
  } catch (error) {
    console.error(`❌ Erro ao baixar ${fileName}:`, error.message);
    return { success: false, fileName, error: error.message };
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando download dos ícones...\n');
  
  const results = [];
  
  // Baixa os ícones em lotes para evitar sobrecarregar a API
  const BATCH_SIZE = 5;
  for (let i = 0; i < ALL_ICONS.length; i += BATCH_SIZE) {
    const batch = ALL_ICONS.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessando lote ${i/BATCH_SIZE + 1} de ${Math.ceil(ALL_ICONS.length/BATCH_SIZE)}...`);
    
    const batchResults = await Promise.all(
      batch.map(icon => downloadIcon(icon.id, icon.name))
    );
    
    results.push(...batchResults);
    
    // Pequena pausa entre os lotes
    if (i + BATCH_SIZE < ALL_ICONS.length) {
      console.log('Aguardando antes do próximo lote...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Gera relatório
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Relatório de Download');
  console.log('='.repeat(50));
  console.log(`✅ ${successful.length} ícones baixados com sucesso`);
  
  if (failed.length > 0) {
    console.log(`❌ ${failed.length} ícones falharam:`);
    failed.forEach(f => console.log(`- ${f.fileName}: ${f.error}`));
  }
  
  console.log('\n🎉 Processo concluído!');
  console.log(`📁 Pasta de destino: ${OUTPUT_DIR}`);
}

// Executa o script
main().catch(console.error);
