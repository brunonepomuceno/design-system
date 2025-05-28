import fs from 'fs';
import path from 'path';
import { ensureDirectoryExists, getAllFiles, readFile } from './utils';

// Load config
const config = require('../../figma.config');

/**
 * Bundle all SVG icons into a single JSON file
 */
async function bundleSvgs(): Promise<void> {
  console.log('Bundling SVG icons...');
  
  const inputDir = path.join(process.cwd(), 'dist', 'icons');
  const outputFile = path.join(process.cwd(), 'dist', 'icons.json');
  
  // Ensure the input directory exists
  try {
    await ensureDirectoryExists(inputDir);
  } catch (error) {
    console.error(`Error accessing directory ${inputDir}:`, error);
    return;
  }
  
  // Get all SVG files in the input directory
  let svgFiles: string[] = [];
  try {
    svgFiles = (await getAllFiles(inputDir)).filter(file => 
      file.toLowerCase().endsWith('.svg')
    );
  } catch (error) {
    console.error('Error reading SVG files:', error);
    return;
  }
  
  if (svgFiles.length === 0) {
    console.warn('No SVG files found in', inputDir);
    return;
  }
  
  console.log(`Found ${svgFiles.length} SVG files to bundle`);
  
  // Process all SVG files
  const icons: Record<string, string> = {};
  
  for (const file of svgFiles) {
    try {
      const relativePath = path.relative(inputDir, file);
      const iconName = path.basename(relativePath, '.svg');
      const iconPath = path.dirname(relativePath);
      const iconKey = path.join(iconPath, iconName).replace(/\\/g, '/');
      
      const content = await readFile(file, 'utf-8');
      icons[iconKey] = content;
      
      console.log(`✓ Bundled ${iconKey}.svg`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  // Write the bundle file
  try {
    const bundle = {
      generatedAt: new Date().toISOString(),
      count: Object.keys(icons).length,
      icons,
    };
    
    await ensureDirectoryExists(path.dirname(outputFile));
    await fs.promises.writeFile(
      outputFile, 
      JSON.stringify(bundle, null, 2),
      'utf-8'
    );
    
    console.log(`\n✅ Successfully bundled ${Object.keys(icons).length} icons into ${outputFile}`);
  } catch (error) {
    console.error('Error writing bundle file:', error);
  }
}

// Run the bundler
bundleSvgs().catch(console.error);
