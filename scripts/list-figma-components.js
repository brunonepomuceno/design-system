const axios = require('axios');
const https = require('https');

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

async function listAllComponents() {
  try {
    console.log('Buscando componentes...');
    
    // Primeiro, obtém a lista de páginas
    const { data: fileData } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}`);
    
    console.log('\nPáginas encontradas:');
    fileData.document.children.forEach(page => {
      console.log(`- ${page.name} (${page.id}) - ${page.children?.length || 0} itens`);
    });
    
    // Agora, busca todos os componentes do arquivo
    console.log('\nBuscando todos os componentes...');
    const { data: componentsData } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}/components`);
    
    if (componentsData.meta && componentsData.meta.components) {
      console.log(`\nTotal de componentes encontrados: ${componentsData.meta.components.length}`);
      
      // Agrupa por página
      const componentsByPage = {};
      
      componentsData.meta.components.forEach(component => {
        const pageId = component.containing_frame?.page_id || 'unknown';
        if (!componentsByPage[pageId]) {
          componentsByPage[pageId] = [];
        }
        componentsByPage[pageId].push(component);
      });
      
      // Exibe os componentes por página
      Object.entries(componentsByPage).forEach(([pageId, components]) => {
        const page = fileData.document.children.find(p => p.id === pageId);
        console.log(`\nPágina: ${page?.name || 'Desconhecida'} (${pageId})`);
        console.log('-' + '-'.repeat(50));
        
        components.forEach(comp => {
          console.log(`- ${comp.name} (${comp.node_id})`);
        });
      });
    } else {
      console.log('Nenhum componente encontrado.');
    }
    
  } catch (error) {
    console.error('Erro ao listar componentes:', error.response?.data || error.message);
  }
}

// Executa a função principal
listAllComponents();
