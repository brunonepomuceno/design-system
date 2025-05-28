const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const https = require('https');
const { optimize } = require('svgo');

// Configurações
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;';
const FILE_KEY = 'pHrUcun54WaijaCoojHoYi';
const NODE_IDS = ['7379:472']; // Nós que contêm os ícones
const OUTPUT_DIR = path.join(__dirname, '../assets/icons');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');
const CSS_FILE = path.join(OUTPUT_DIR, 'icons.css');

// Configura o agente HTTPS
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Configura o axios
const figmaApi = axios.create({
  baseURL: 'https://api.figma.com/v1',
  headers: { 'X-Figma-Token': FIGMA_API_KEY },
  httpsAgent: httpsAgent
});

// Otimiza o SVG
async function optimizeSvg(svgContent, iconName) {
  try {
    const result = await optimize(svgContent, {
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
  } catch (error) {
    console.error(`Erro ao otimizar o ícone ${iconName}:`, error.message);
    return svgContent;
  }
}

// Extrai os ícones
async function extractIcons() {
  try {
    // Cria o diretório de saída
    await fs.ensureDir(OUTPUT_DIR);
    
    // Array para armazenar metadados
    const metadata = [];
    let cssContent = '/* Ícones gerados automaticamente */\n\n';
    
    console.log('Iniciando extração de ícones...');
    
    // Para cada nó que contém ícones
    for (const nodeId of NODE_IDS) {
      console.log(`Processando nó: ${nodeId}`);
      
      try {
        // Obtém as informações do nó
        const { data: nodeData } = await figmaApi.get(`/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}`);
        
        // Verifica se o nó existe
        const nodeInfo = nodeData.nodes?.[nodeId]?.document;
        if (!nodeInfo) {
          console.error(`Nó ${nodeId} não encontrado`);
          continue;
        }
        
        console.log(`Nó encontrado: ${nodeInfo.name}`);
        
        // Verifica se há filhos no nó
        const children = nodeInfo.children || [];
        console.log(`Encontrados ${children.length} itens no nó`);
        
        // Para cada filho (ícone)
        for (const child of children) {
          if (child.type !== 'COMPONENT' && child.type !== 'INSTANCE' && child.type !== 'FRAME' && child.type !== 'GROUP') {
            console.log(`Pulando item do tipo ${child.type}: ${child.name}`);
            continue;
          }
          
          const iconName = child.name.toLowerCase().replace(/\s+/g, '-');
          const iconId = child.id;
          
          console.log(`Processando ícone: ${iconName} (${iconId})`);
          
          try {
            // Obtém a imagem do ícone
            const { data: images } = await figmaApi.get(`/images/${FILE_KEY}?ids=${iconId}&format=svg`);
            const imageUrl = images.images[iconId];
            
            if (!imageUrl) {
              console.error(`URL da imagem não encontrada para o ícone ${iconName}`);
              continue;
            }
            
            // Faz o download do SVG
            const { data: svgContent } = await axios.get(imageUrl, { 
              responseType: 'text',
              httpsAgent: httpsAgent 
            });
            
            // Otimiza o SVG
            const optimizedSvg = await optimizeSvg(svgContent, iconName);
            
            // Salva o SVG
            const svgFileName = `${iconName}.svg`;
            const svgFilePath = path.join(OUTPUT_DIR, svgFileName);
            await fs.writeFile(svgFilePath, optimizedSvg, 'utf8');
            
            // Adiciona metadados
            metadata.push({
              name: child.name,
              id: iconId,
              fileName: svgFileName,
              tags: child.name.toLowerCase().split(/[\s-]+/),
              type: child.type,
              createdAt: new Date().toISOString()
            });
            
            // Adiciona a classe CSS
            cssContent += `.icon-${iconName} {\n  background-image: url('./${svgFileName}');\n  width: 24px;\n  height: 24px;\n  display: inline-block;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n\n`;
            
            console.log(`✅ Ícone extraído: ${iconName}`);
            
            // Pequeno delay para evitar sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            console.error(`Erro ao processar o ícone ${iconName}:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`Erro ao processar o nó ${nodeId}:`, error.message);
      }
    }
    
    // Salva os metadados
    await fs.writeJson(METADATA_FILE, metadata, { spaces: 2 });
    
    // Salva o CSS
    await fs.writeFile(CSS_FILE, cssContent, 'utf8');
    
    console.log('\n✅ Extração concluída!');
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
