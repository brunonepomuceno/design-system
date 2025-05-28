import fs from 'fs';
import path from 'path';
import { getFile, getImageUrls, downloadImage, ensureDirectoryExists } from './utils/figma';
import config from '../../figma.config';

// Interface for icon metadata
interface IconMetadata {
  name: string;
  componentName: string;
  fileName: string;
  category: string;
  tags: string[];
  variants: {
    [key: string]: {
      [size: string]: string; // size: url
    };
  };
}

// Main function to generate icons
async function generateIcons() {
  try {
    console.log('🚀 Starting icon generation process...');
    
    // 1. Fetch the Figma file data
    console.log('📡 Fetching Figma file data...');
    const fileData = await getFile();
    
    // 2. Extract icon components (this is a simplified example)
    // In a real implementation, you would parse the fileData to find all icon components
    console.log('🔍 Extracting icon components...');
    const icons = extractIcons(fileData);
    
    // 3. Process each icon
    console.log('🔄 Processing icons...');
    await processIcons(icons);
    
    // 4. Generate React components
    console.log('⚛️  Generating React components...');
    await generateReactComponents(icons);
    
    // 5. Generate CSS
    console.log('🎨 Generating CSS...');
    await generateCSS(icons);
    
    // 6. Generate documentation
    console.log('📝 Generating documentation...');
    await generateDocumentation(icons);
    
    console.log('✅ Icon generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Extract icons from Figma file data
function extractIcons(fileData: any): IconMetadata[] {
  // This is a placeholder implementation
  // In a real implementation, you would parse the fileData to find all icon components
  // and extract their metadata
  
  // For now, we'll return a sample icon
  return [
    {
      name: 'sample-icon',
      componentName: 'SampleIcon',
      fileName: 'sample-icon',
      category: 'general',
      tags: ['sample', 'example'],
      variants: {
        outline: {
          '24': 'https://example.com/sample-icon-outline-24.svg',
        },
        filled: {
          '24': 'https://example.com/sample-icon-filled-24.svg',
        },
      },
    },
  ];
}

// Process icons (download SVGs, etc.)
async function processIcons(icons: IconMetadata[]) {
  // Ensure output directory exists
  ensureDirectoryExists(config.outputDir);
  
  // Process each icon
  for (const icon of icons) {
    const iconDir = path.join(config.outputDir, icon.fileName);
    ensureDirectoryExists(iconDir);
    
    // Download each variant and size
    for (const [variant, sizes] of Object.entries(icon.variants)) {
      for (const [size, url] of Object.entries(sizes)) {
        const fileName = `${icon.fileName}-${variant}-${size}.svg`;
        const outputPath = path.join(iconDir, fileName);
        
        try {
          await downloadImage(url, outputPath);
          console.log(`  ✅ Downloaded ${fileName}`);
        } catch (error) {
          console.error(`  ❌ Failed to download ${fileName}:`, error);
        }
      }
    }
  }
}

// Generate React components for each icon
async function generateReactComponents(icons: IconMetadata[]) {
  ensureDirectoryExists(config.reactDir);
  
  // Create an index file to export all components
  const indexExports: string[] = [];
  
  for (const icon of icons) {
    const componentName = icon.componentName;
    const componentPath = path.join(config.reactDir, `${componentName}.tsx`);
    
    // Generate the component code
    const componentCode = `import React from 'react';
import { IconProps } from '../types';

const ${componentName}: React.FC<IconProps> = ({
  size = '24px',
  variant = 'outline',
  color = 'currentColor',
  ...props
}) => {
  // This is a placeholder - in a real implementation, you would include the SVG content here
  // or dynamically import it based on the variant and size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={variant === 'filled' ? color : 'none'}
        stroke={variant === 'outline' ? color : 'none'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ${componentName};
`;

    // Write the component file
    fs.writeFileSync(componentPath, componentCode);
    console.log(`  ✅ Generated ${componentName}.tsx`);
    
    // Add to index exports
    indexExports.push(`export { default as ${componentName} } from './${componentName}';`);
  }
  
  // Write the index file
  const indexPath = path.join(config.reactDir, 'index.ts');
  fs.writeFileSync(indexPath, indexExports.join('\n') + '\n');
  console.log('  ✅ Generated index.ts');
}

// Generate CSS for the icons
async function generateCSS(icons: IconMetadata[]) {
  const cssContent = `/* Icons CSS */
/* This file is auto-generated. Do not edit directly. */

.icon {
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
}

/* Icon variants */
`;

  // Ensure the directory exists
  ensureDirectoryExists(path.dirname(config.cssFile));
  
  // Write the CSS file
  fs.writeFileSync(config.cssFile, cssContent);
  console.log(`  ✅ Generated ${config.cssFile}`);
}

// Generate documentation
async function generateDocumentation(icons: IconMetadata[]) {
  const categories: { [key: string]: IconMetadata[] } = {};
  
  // Group icons by category
  icons.forEach(icon => {
    if (!categories[icon.category]) {
      categories[icon.category] = [];
    }
    categories[icon.category].push(icon);
  });
  
  // Generate markdown content
  let markdown = `# Icon Library\n\n`;
  markdown += `This library contains ${icons.length} icons.\n\n`;
  
  // Table of contents
  markdown += '## Table of Contents\n\n';
  Object.keys(categories).sort().forEach(category => {
    markdown += `- [${category.charAt(0).toUpperCase() + category.slice(1)}](#${category.toLowerCase()})\n`;
  });
  markdown += '\n';
  
  // Icons by category
  Object.entries(categories).sort().forEach(([category, categoryIcons]) => {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    markdown += '| Icon | Name | Variants | Tags |\n';
    markdown += '|------|------|----------|------|\n';
    
    categoryIcons.forEach(icon => {
      const variants = Object.keys(icon.variants).join(', ');
      const tags = icon.tags.join(', ');
      
      markdown += `| ![${icon.name}](./${config.outputDir}/${icon.fileName}/${icon.fileName}-outline-24.svg) | \`${icon.name}\` | ${variants} | ${tags} |\n`;
    });
    
    markdown += '\n';
  });
  
  // Write the documentation file
  fs.writeFileSync(config.docsFile, markdown);
  console.log(`  ✅ Generated ${config.docsFile}`);
}

// Run the generator
generateIcons();
