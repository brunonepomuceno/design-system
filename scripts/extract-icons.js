const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const https = require('https');

// Configura o agente HTTPS para ignorar erros de certificado (apenas para desenvolvimento)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Configura o axios para usar o agente personalizado
axios.defaults.httpsAgent = httpsAgent;
const { optimize } = require('svgo');

// Configurações
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;';
const FILE_KEY = 'pHrUcun54WaijaCoojHoYi';
const NODE_IDS = ['22:5', '7379:472']; // IDs dos nós que contêm os ícones
const OUTPUT_DIR = path.join(__dirname, '../assets/icons');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');
const CSS_FILE = path.join(OUTPUT_DIR, 'icons.css');

// Cliente HTTP para a API do Figma
const figmaApi = axios.create({
  baseURL: 'https://api.figma.com/v1',
  headers: { 'X-Figma-Token': FIGMA_API_KEY },
  httpsAgent: httpsAgent // Usa o agente personalizado
});

// Otimiza o SVG
function optimizeSvg(svgContent) {
  const result = optimize(svgContent, {
    plugins: [
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeEditorsNSData',
      'cleanupAttrs',
      'mergeStyles',
      'inlineStyles',
      'minifyStyles',
      'cleanupIDs',
      'removeUselessDefs',
      'cleanupNumericValues',
      'convertColors',
      'removeEmptyAttrs',
      'removeHiddenElems',
      'moveGroupAttrsToElems',
      'removeEmptyText',
      'removeEmptyContainers',
      'removeViewBox',
      'cleanupEnableBackground',
      'removeNonInheritableGroupAttrs',
      'removeUselessStrokeAndFill',
      'removeUnusedNS',
      'cleanupListOfValues',
      'convertPathData',
      'convertTransform',
      'removeUnknownsAndDefaults',
      'removeXMLNS',
      'removeDimensions',
      'removeAttrs',
    ],
  });
  return result.data;
}

// Extrai os ícones
async function extractIcons() {
  try {
    // Cria o diretório de saída
    await fs.ensureDir(OUTPUT_DIR);
    
    // Array para armazenar metadados
    const metadata = [];
    let cssContent = '/* Ícones gerados automaticamente */\n\n';
    
    // Para cada nó que contém ícones
    for (const nodeId of NODE_IDS) {
      // Obtém as informações do nó
      const { data: nodeData } = await figmaApi.get(`/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}`);
      
      // Verifica se o nó existe
      const nodeInfo = nodeData.nodes?.[nodeId]?.document;
      if (!nodeInfo) {
        console.error(`Nó ${nodeId} não encontrado`);
        continue;
      }
      
      // Obtém os componentes (ícones)
      const components = nodeInfo.children || [];
      
      // Para cada componente (ícone)
      for (const component of components) {
        if (component.type !== 'COMPONENT' && component.type !== 'INSTANCE') {
          continue;
        }
        
        const iconName = component.name.toLowerCase().replace(/\s+/g, '-');
        const iconId = component.id;
        
        // Obtém a imagem do ícone
        const { data: images } = await figmaApi.get(`/images/${FILE_KEY}?ids=${iconId}&format=svg`);
        const imageUrl = images.images[iconId];
        
        if (!imageUrl) {
          console.error(`URL da imagem não encontrada para o ícone ${iconName}`);
          continue;
        }
        
        // Faz o download do SVG
        const { data: svgContent } = await axios.get(imageUrl, { responseType: 'text' });
        
        // Otimiza o SVG
        const optimizedSvg = optimizeSvg(svgContent);
        
        // Salva o SVG
        const svgFileName = `${iconName}.svg`;
        const svgFilePath = path.join(OUTPUT_DIR, svgFileName);
        await fs.writeFile(svgFilePath, optimizedSvg, 'utf8');
        
        // Adiciona metadados
        metadata.push({
          name: component.name,
          id: iconId,
          fileName: svgFileName,
          tags: component.name.toLowerCase().split(/[\s-]+/),
          category: nodeInfo.name.toLowerCase().replace(/\s+/g, '-'),
        });
        
        // Adiciona a classe CSS
        cssContent += `.icon-${iconName} {\n  background-image: url('./${svgFileName}');\n  width: 24px;\n  height: 24px;\n  display: inline-block;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n\n`;
        
        console.log(`Ícone extraído: ${iconName}`);
      }
    }
    
    // Salva os metadados
    await fs.writeJson(METADATA_FILE, metadata, { spaces: 2 });
    
    // Salva o CSS
    await fs.writeFile(CSS_FILE, cssContent, 'utf8');
    
    console.log('\nExtração concluída com sucesso!');
    console.log(`- Ícones salvos em: ${OUTPUT_DIR}`);
    console.log(`- Metadados salvos em: ${METADATA_FILE}`);
    console.log(`- CSS salvo em: ${CSS_FILE}`);
    
  } catch (error) {
    console.error('Erro ao extrair ícones:');
    console.error(error.response?.data || error.message);
  }
}

// Executa a extração
extractIcons();
