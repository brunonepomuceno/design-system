import fs from 'fs';
import path from 'path';
import { optimize, Config as SvgoConfig } from 'svgo';
import { ensureDirectoryExists, getAllFiles, readFile, writeFile } from './utils';

// Load config
const config = require('../../figma.config');

// SVGO configuration
const svgoConfig: SvgoConfig = {
  multipass: true,
  plugins: [
    'cleanupAttrs',
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeTitle',
    'removeDesc',
    'removeUselessDefs',
    'removeEditorsNSData',
    'removeEmptyAttrs',
    'removeHiddenElems',
    'removeEmptyText',
    'removeEmptyContainers',
    'removeViewBox',
    'cleanupEnableBackground',
    'convertStyleToAttrs',
    'convertColors',
    'convertPathData',
    'convertTransform',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeUnusedNS',
    'cleanupIDs',
    'cleanupNumericValues',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'removeRasterImages',
    'mergePaths',
    'convertShapeToPath',
    'sortAttrs',
    'removeDimensions',
    'removeAttrs',
    'removeElementsByAttr',
    'removeStyleElement',
    'removeScriptElement',
    'prefixIds',
    'cleanupListOfValues',
    'convertEllipseToCircle',
    'sortDefsChildren',
    'removeOffCanvasPaths',
    'reusePaths'
  ].map(plugin => ({
    name: plugin,
    active: true
  })) as any[], // Type assertion to handle SVGO plugin types
};

/**
 * Optimize a single SVG file
 */
async function optimizeSvgFile(filePath: string, outputPath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const result = optimize(content, { ...svgoConfig, path: filePath });
    
    if (!result.data) {
      console.error(`Error optimizing ${filePath}: No data returned from optimizer`);
      return;
    }
    
    // Ensure the output directory exists
    await ensureDirectoryExists(path.dirname(outputPath));
    
    // Write the optimized SVG
    await writeFile(outputPath, result.data, 'utf-8');
    
    // Get file size before and after
    const originalSize = (await fs.promises.stat(filePath)).size;
    const optimizedSize = (await fs.promises.stat(outputPath)).size;
    const saved = originalSize - optimizedSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(2);
    
    console.log(`✓ Optimized ${path.basename(filePath)}: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (saved ${savedPercent}%)`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Format file size in a human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Optimize all SVG files in the icons directory
 */
async function optimizeAllSvgs(): Promise<void> {
  console.log('Optimizing SVG icons...');
  
  const inputDir = path.join(process.cwd(), 'assets', 'icons');
  const outputDir = path.join(process.cwd(), 'dist', 'icons');
  
  // Ensure the output directory exists
  await ensureDirectoryExists(outputDir);
  
  // Get all SVG files in the input directory
  const svgFiles = (await getAllFiles(inputDir)).filter(file => 
    file.toLowerCase().endsWith('.svg')
  );
  
  if (svgFiles.length === 0) {
    console.warn('No SVG files found in', inputDir);
    return;
  }
  
  console.log(`Found ${svgFiles.length} SVG files to optimize`);
  
  // Process all SVG files in parallel
  await Promise.all(
    svgFiles.map(async (file) => {
      const relativePath = path.relative(inputDir, file);
      const outputPath = path.join(outputDir, relativePath);
      
      await optimizeSvgFile(file, outputPath);
    })
  );
  
  console.log('SVG optimization complete!');
}

// Run the optimization
optimizeAllSvgs().catch(console.error);
