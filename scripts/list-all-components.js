const axios = require('axios');
const https = require('https');

// Configurações
const CONFIG = {
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
    
    // Primeiro, obtém a estrutura do arquivo
    const { data: fileData } = await figmaApi.get(`/files/${CONFIG.FILE_KEY}`);
    
    console.log('\nPáginas encontradas:');
    fileData.document.children.forEach(page => {
      console.log(`- ${page.name} (${page.id}) - ${page.children?.length || 0} itens`);
      
      // Verifica se esta página contém frames de ícones
      if (page.children) {
        page.children.forEach(child => {
          if (child.type === 'FRAME' || child.type === 'GROUP') {
            console.log(`  └─ ${child.name} (${child.id}) - ${child.children?.length || 0} itens`);
            
            // Se houver filhos, lista os primeiros 5
            if (child.children && child.children.length > 0) {
              console.log('     Primeiros itens:');
              child.children.slice(0, 5).forEach((item, index) => {
                console.log(`     ${index + 1}. ${item.name} (${item.id})`);
              });
              if (child.children.length > 5) {
                console.log(`     ...e mais ${child.children.length - 5} itens`);
              }
            }
          }
        });
      }
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
