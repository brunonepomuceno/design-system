const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const https = require('https');
const { optimize } = require('svgo');

// Configurações
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;';
const FILE_KEY = 'pHrUcun54WaijaCoojHoYi';
const OUTPUT_DIR = path.join(__dirname, '../assets/icons');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');
const CSS_FILE = path.join(OUTPUT_DIR, 'icons.css');

// Configura o agente HTTPS para ignorar erros de certificado (apenas para desenvolvimento)
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
    return svgContent; // Retorna o SVG original em caso de erro
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
    
    console.log('Obtendo informações do arquivo Figma...');
    
    // Primeiro, obtém os componentes do arquivo
    const { data: fileData } = await figmaApi.get(`/files/${FILE_KEY}/components`);
    
    if (!fileData.meta || !fileData.meta.components) {
      console.error('Nenhum componente encontrado no arquivo');
      return;
    }
    
    console.log(`Encontrados ${fileData.meta.components.length} componentes no arquivo`);
    
    // Para cada componente (ícone)
    for (const component of fileData.meta.components) {
      const iconName = component.name.toLowerCase().replace(/\s+/g, '-');
      const iconId = component.node_id;
      
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
          name: component.name,
          id: iconId,
          fileName: svgFileName,
          tags: component.name.toLowerCase().split(/[\s-]+/),
          description: component.description || '',
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
    
    // Salva os metadados
    await fs.writeJson(METADATA_FILE, metadata, { spaces: 2 });
    
    // Salva o CSS
    await fs.writeFile(CSS_FILE, cssContent, 'utf8');
    
    console.log('\n✅ Extração concluída com sucesso!');
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
