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
    return true;
  } catch (error) {
    console.error(`❌ Erro ao baixar ${fileName}:`, error.message);
    return false;
  }
}

// Lista de ícones para baixar
const icons = [
  { id: '1998:370', name: 'whatsapp.svg' },
  { id: '2180:416', name: 'facebook.svg' },
  { id: '2180:418', name: 'twitter.svg' },
  { id: '4586:477', name: 'instagram.svg' },
  { id: '2180:419', name: 'youtube.svg' },
  { id: '4586:439', name: 'linkedin.svg' },
  { id: '1998:400', name: 'verified.svg' },
  { id: '7887:210', name: 'wifi.svg' },
  { id: '2170:496', name: 'database.svg' },
  { id: '2170:499', name: 'data-analysis.svg' }
];

// Função principal
async function main() {
  console.log('🚀 Iniciando download dos ícones...\n');
  
  const results = [];
  
  // Baixa um ícone por vez para evitar sobrecarregar a API
  for (const icon of icons) {
    const success = await downloadIcon(icon.id, icon.name);
    results.push(success);
    // Pequena pausa entre as requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successCount = results.filter(Boolean).length;
  console.log(`\n🎉 Download concluído! ${successCount} de ${icons.length} ícones baixados.`);
}

// Executa o script
main().catch(console.error);
