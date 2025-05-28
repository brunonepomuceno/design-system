require('dotenv').config();
console.log('FIGMA_API_KEY:', process.env.FIGMA_API_KEY ? '✅ Presente' : '❌ Ausente');
console.log('Valor do token:', process.env.FIGMA_API_KEY ? '***' + process.env.FIGMA_API_KEY.slice(-4) : 'N/A');
