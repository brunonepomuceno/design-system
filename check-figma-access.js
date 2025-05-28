require('dotenv').config();
const https = require('https');

const FIGMA_API_KEY = process.env.FIGMA_API_KEY;
const FIGMA_FILE_KEY = 'pHrUcun54WaijaCoojHoYi';

console.log('Verificando acesso à API do Figma...');
console.log('Token:', FIGMA_API_KEY ? '✅ Presente' : '❌ Ausente');

if (!FIGMA_API_KEY) {
  console.error('Erro: FIGMA_API_KEY não encontrado no arquivo .env');
  process.exit(1);
}

const options = {
  hostname: 'api.figma.com',
  path: `/v1/files/${FIGMA_FILE_KEY}`,
  method: 'GET',
  headers: {
    'X-Figma-Token': FIGMA_API_KEY
  }
};

console.log('\nFazendo requisição para:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log('\nResposta da API:');
  console.log('Status:', res.statusCode, res.statusMessage);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Acesso à API do Figma bem-sucedido!');
        console.log('Nome do arquivo:', jsonData.name);
        console.log('Última modificação:', jsonData.lastModified);
      } else {
        console.error('❌ Erro na requisição:');
        console.error('Código:', jsonData.status || res.statusCode);
        console.error('Mensagem:', jsonData.message || jsonData.err || 'Erro desconhecido');
      }
    } catch (e) {
      console.error('❌ Erro ao processar a resposta:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Erro ao conectar à API do Figma:');
  console.error(error.message);
});

req.end();