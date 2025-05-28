require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Load config
const config = require('../../figma.config');
let metadata;

try {
  metadata = require(path.resolve(config.metadataFile));
} catch (error) {
  console.error('Error loading metadata file. Please run the icon extraction first.');
  process.exit(1);
}

// Template for React component
const componentTemplate = (componentName, svgContent) => `import React from 'react';
import { IconProps } from '../src/types';

const ${componentName}: React.FC<IconProps> = ({
  size = '24px',
  variant = 'outline',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={\`icon icon-${componentName.toLowerCase()} ${className}\`.trim()}
      {...props}
    >
      ${svgContent}
    </svg>
  );
};

export default ${componentName};
`;

// Template for index file
generateIndexContent = (componentNames) => `// This file is auto-generated. Do not edit manually.
${componentNames.map(name => `import ${name} from './${name}';`).join('\n')}

export {
  ${componentNames.join(',\n  ')}
};
`;

async function generateReactComponents() {
  console.log('Generating React components...');
  
  // Ensure output directory exists
  await ensureDirectoryExists(config.reactDir);
  
  const componentNames = [];
  
  // Process each icon
  for (const icon of metadata.icons) {
    const iconDir = path.join(config.outputDir, icon.fileName);
    const svgFile = path.join(iconDir, `${icon.fileName}.svg`);
    
    try {
      // Read the SVG content
      const svgContent = await readFile(svgFile, 'utf8');
      
      // Extract the inner content of the SVG
      const innerContent = svgContent
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '')
        .trim();
      
      // Generate the React component
      const componentContent = componentTemplate(icon.componentName, innerContent);
      const componentPath = path.join(config.reactDir, `${icon.componentName}.tsx`);
      
      await writeFile(componentPath, componentContent);
      console.log(`Generated: ${componentPath}`);
      
      componentNames.push(icon.componentName);
    } catch (error) {
      console.error(`Error processing ${icon.fileName}:`, error);
    }
  }
  
  // Generate index file
  const indexPath = path.join(config.reactDir, 'index.ts');
  await writeFile(indexPath, generateIndexContent(componentNames));
  console.log(`Generated: ${indexPath}`);
  
  console.log('React components generation complete!');
  return componentNames;
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(directory) {
  try {
    await fs.promises.mkdir(directory, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Run the generator
generateReactComponents().catch(console.error);
