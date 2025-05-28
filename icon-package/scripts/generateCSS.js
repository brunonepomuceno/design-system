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

// CSS template
const cssTemplate = (icons) => `/* This file is auto-generated. Do not edit directly. */

.icon {
  display: inline-flex;
  vertical-align: middle;
  fill: currentColor;
  width: 1em;
  height: 1em;
}

/* Icon variants */
.icon-outline {
  /* Default styles for outline variant */
}

.icon-filled {
  /* Default styles for filled variant */
}

/* Individual icon styles */
${icons.map(icon => `
/* ${icon.componentName} */
.icon-${icon.componentName} {
  /* Custom styles for ${icon.componentName} */
}`).join('\n')}
`;

async function generateCSS() {
  console.log('Generating CSS...');
  
  // Ensure output directory exists
  const cssDir = path.dirname(config.cssFile);
  await ensureDirectoryExists(cssDir);
  
  // Generate CSS content
  const cssContent = cssTemplate(metadata.icons);
  
  // Write CSS file
  await writeFile(config.cssFile, cssContent);
  console.log(`Generated: ${config.cssFile}`);
  
  console.log('CSS generation complete!');
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
generateCSS().catch(console.error);
