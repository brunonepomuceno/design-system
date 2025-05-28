const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');
require('dotenv').config();

// Configura o agente HTTPS para ignorar erros de certificado
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Configura o axios para ignorar erros de certificado
const axiosInstance = axios.create({
  httpsAgent: httpsAgent
});

// Configurações
if (!process.env.FIGMA_API_KEY) {
  console.error('❌ Erro: A variável de ambiente FIGMA_API_KEY não está definida.');
  console.error('Por favor, adicione sua chave da API do Figma no arquivo .env');
  process.exit(1);
}

const FIGMA_API_KEY = process.env.FIGMA_API_KEY;
const FILE_KEY = 'pHrUcun54WaijaCoojHoYi';
const OUTPUT_DIR = path.join(__dirname, '../assets/icons');

// Configura o cliente HTTP
const figmaApi = axios.create({
  baseURL: 'https://api.figma.com/v1',
  headers: { 'X-Figma-Token': FIGMA_API_KEY }
});

// Cria o diretório de saída se não existir
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Baixa uma imagem de um nó
async function downloadNodeImage(nodeId, fileName) {
  try {
    // Obtém a URL da imagem
    const { data } = await figmaApi.get(`/images/${FILE_KEY}?ids=${nodeId}&format=svg`);
    
    if (!data.images || !data.images[nodeId]) {
      throw new Error(`Nenhuma imagem encontrada para o nó ${nodeId}`);
    }
    
    const imageUrl = data.images[nodeId];
    
    // Baixa a imagem
    const response = await axiosInstance.get(imageUrl, { responseType: 'arraybuffer' });
    
    // Salva o arquivo
    const filePath = path.join(OUTPUT_DIR, fileName);
    await fs.writeFile(filePath, response.data);
    
    console.log(`✅ ${fileName} baixado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao baixar ${fileName}:`, error.message);
    return false;
  }
}

// Lista de ícones para baixar (ID do nó e nome do arquivo)
const ICONS_TO_DOWNLOAD = [
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
  try {
    console.log('🔄 Iniciando download dos ícones...');
    
    // Garante que o diretório de saída existe
    await ensureDir(OUTPUT_DIR);
    
    // Baixa cada ícone
    const results = await Promise.all(
      ICONS_TO_DOWNLOAD.map(({ id, name }) => downloadNodeImage(id, name))
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`\n🎉 Download concluído! ${successCount} de ${ICONS_TO_DOWNLOAD.length} ícones baixados.`);
    
  } catch (error) {
    console.error('❌ Erro no processo de download:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();
