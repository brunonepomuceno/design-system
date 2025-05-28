require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

// Load config
const config = require('../../figma.config');
let metadata;

try {
  metadata = require(path.resolve(config.metadataFile));
} catch (error) {
  console.error('Error loading metadata file. Please run the icon extraction first.');
  process.exit(1);
}

// Group icons by category
function groupIconsByCategory(icons) {
  return icons.reduce((acc, icon) => {
    const category = icon.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(icon);
    return acc;
  }, {});
}

// Generate markdown content
function generateMarkdown(icons) {
  const categories = groupIconsByCategory(icons);
  const categoryNames = Object.keys(categories).sort();
  
  let markdown = `# Icon Library\n\n`;
  markdown += `This library contains ${icons.length} icons.\n\n`;
  
  // Table of contents
  markdown += '## Table of Contents\n\n';
  categoryNames.forEach(category => {
    const displayName = category.charAt(0).toUpperCase() + category.slice(1);
    markdown += `- [${displayName}](#${category.toLowerCase()})\n`;
  });
  markdown += '\n';
  
  // Icons by category
  categoryNames.forEach(category => {
    const displayName = category.charAt(0).toUpperCase() + category.slice(1);
    const categoryIcons = categories[category];
    
    markdown += `## ${displayName}\n\n`;
    markdown += '| Preview | Name | Component | Variants |\n';
    markdown += '|---------|------|------------|----------|\n';
    
    categoryIcons.forEach(icon => {
      const variants = Object.keys(icon.variants || {}).join(', ');
      const previewPath = path.relative(
        path.dirname(config.docsFile),
        path.join(config.outputDir, icon.fileName, `${icon.fileName}.svg`)
      );
      
      markdown += `| ![${icon.name}](${previewPath}) | \`${icon.name}\` | \`${icon.componentName}\` | ${variants} |\n`;
    });
    
    markdown += '\n';
  });
  
  return markdown;
}

async function generateDocumentation() {
  console.log('Generating documentation...');
  
  // Generate markdown content
  const markdown = generateMarkdown(metadata.icons);
  
  // Write documentation file
  await writeFile(config.docsFile, markdown);
  console.log(`Generated: ${config.docsFile}`);
  
  console.log('Documentation generation complete!');
}

// Run the generator
generateDocumentation().catch(console.error);
