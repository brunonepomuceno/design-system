#!/usr/bin/env node

require('dotenv').config();
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const path = require('path');
const fs = require('fs');

// Configuration
const config = require('../../figma.config');

// Verify Figma access token is set
if (!process.env.FIGMA_ACCESS_TOKEN) {
  console.error('❌ Error: FIGMA_ACCESS_TOKEN environment variable is not set');
  console.log('\nPlease create a .env file in the root of your project with:');
  console.log('FIGMA_ACCESS_TOKEN=your_figma_access_token_here\n');
  console.log('You can get your token from: https://www.figma.com/settings/account');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Helper function to run a command
async function runCommand(command, cwd = process.cwd()) {
  console.log(`${colors.cyan}▶ ${command}${colors.reset}`);
  try {
    const { stdout, stderr } = await exec(command, { cwd });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.green}🚀 Starting icon package generation...${colors.reset}\n`);
  
  // 1. Clean up previous builds
  console.log(`${colors.bright}🧹 Cleaning up previous builds...${colors.reset}`);
  await runCommand('npm run clean');
  
  // 2. Extract icons from Figma
  console.log(`\n${colors.bright}🎨 Extracting icons from Figma...${colors.reset}`);
  try {
    require('./extractIcons');
    console.log(`${colors.green}✅ Icons extracted successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error extracting icons:`, error);
    process.exit(1);
  }
  
  // 3. Generate React components
  console.log(`\n${colors.bright}⚛️  Generating React components...${colors.reset}`);
  try {
    require('./generateReactComponents');
    console.log(`${colors.green}✅ React components generated successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error generating React components:`, error);
    process.exit(1);
  }
  
  // 4. Generate CSS
  console.log(`\n${colors.bright}🎨 Generating CSS...${colors.reset}`);
  try {
    require('./generateCSS');
    console.log(`${colors.green}✅ CSS generated successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error generating CSS:`, error);
    process.exit(1);
  }
  
  // 5. Optimize SVGs
  console.log(`\n${colors.bright}✨ Optimizing SVGs...${colors.reset}`);
  try {
    require('./optimizeSvgs');
    console.log(`${colors.green}✅ SVGs optimized successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error optimizing SVGs:`, error);
    process.exit(1);
  }
  
  // 6. Bundle SVGs into a single JSON file
  console.log(`\n${colors.bright}📦 Bundling SVGs...${colors.reset}`);
  try {
    require('./bundleSvgs');
    console.log(`${colors.green}✅ SVGs bundled successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error bundling SVGs:`, error);
    process.exit(1);
  }
  
  // 7. Generate TypeScript type definitions
  console.log(`\n${colors.bright}📝 Generating TypeScript types...${colors.reset}`);
  try {
    require('./generateIconTypes');
    console.log(`${colors.green}✅ TypeScript types generated successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error generating TypeScript types:`, error);
    process.exit(1);
  }
  
  // 5. Generate documentation
  console.log(`\n${colors.bright}📝 Generating documentation...${colors.reset}`);
  try {
    require('./generateDocumentation');
    console.log(`${colors.green}✅ Documentation generated successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error generating documentation:`, error);
    process.exit(1);
  }
  
  // 6. Build the package
  console.log(`\n${colors.bright}🔨 Building the package...${colors.reset}`);
  await runCommand('npm run build');
  
  console.log(`\n${colors.bright}${colors.green}✨ Icon package generation complete!${colors.reset}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated files in ${colors.cyan}${path.relative(process.cwd(), config.outputDir)}/${colors.reset}`);
  console.log(`2. Check the documentation at ${colors.cyan}${path.relative(process.cwd(), config.docsFile)}${colors.reset}`);
  console.log(`3. Test the components by importing them in your project\n`);
}

// Run the main function
main().catch(console.error);
