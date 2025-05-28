import fs from 'fs';
import path from 'path';
import { ensureDirectoryExists, getAllFiles } from './utils';

// Load config
const config = require('../../figma.config');

/**
 * Generate TypeScript type definitions for the icons
 */
async function generateIconTypes(): Promise<void> {
  console.log('Generating TypeScript type definitions for icons...');
  
  const iconsDir = path.join(process.cwd(), 'dist', 'icons');
  const outputFile = path.join(process.cwd(), 'dist', 'types', 'icons.d.ts');
  
  // Ensure the input directory exists
  try {
    await ensureDirectoryExists(iconsDir);
  } catch (error) {
    console.error(`Error accessing directory ${iconsDir}:`, error);
    return;
  }
  
  // Get all SVG files in the icons directory
  let svgFiles: string[] = [];
  try {
    svgFiles = (await getAllFiles(iconsDir)).filter(file => 
      file.toLowerCase().endsWith('.svg')
    );
  } catch (error) {
    console.error('Error reading SVG files:', error);
    return;
  }
  
  if (svgFiles.length === 0) {
    console.warn('No SVG files found in', iconsDir);
    return;
  }
  
  console.log(`Found ${svgFiles.length} SVG files for type generation`);
  
  // Generate type definitions
  const iconNames: string[] = [];
  const iconCategories: Record<string, string[]> = {};
  
  for (const file of svgFiles) {
    try {
      const relativePath = path.relative(iconsDir, file);
      const iconName = path.basename(relativePath, '.svg');
      const category = path.dirname(relativePath);
      
      // Add to icon names
      const fullName = category ? `${category}/${iconName}` : iconName;
      iconNames.push(fullName);
      
      // Add to categories
      if (!iconCategories[category]) {
        iconCategories[category] = [];
      }
      iconCategories[category].push(iconName);
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  // Generate the type definition content
  const typeDefinition = `// Type definitions for ${config.name} icons
// Generated on ${new Date().toISOString()}

/**
 * All available icon names as a union type
 */
export type IconName = 
${iconNames.map(name => `  | '${name}'`).join('\n')};

/**
 * Icon categories and their respective icons
 */
export interface IconCategories {
${Object.entries(iconCategories)
  .map(([category, icons]) => `  '${category}': [
${icons.map(icon => `    '${icon}',`).join('\n')}
  ];`)
  .join('\n')}
}

/**
 * Icon metadata
 */
export interface IconMetadata {
  /**
   * The name of the icon
   */
  name: string;
  
  /**
   * The category of the icon (empty string for no category)
   */
  category: string;
  
  /**
   * The SVG content of the icon
   */
  svg: string;
}

/**
 * Type guard to check if a string is a valid icon name
 * @param name The name to check
 * @returns True if the name is a valid icon name
 */
export function isIconName(name: string): name is IconName {
  return (${iconNames.map(n => `name === '${n}'`).join(' || ')});
}
`;
  
  // Write the type definition file
  try {
    await ensureDirectoryExists(path.dirname(outputFile));
    await fs.promises.writeFile(outputFile, typeDefinition, 'utf-8');
    
    console.log(`✅ Successfully generated TypeScript type definitions in ${outputFile}`);
  } catch (error) {
    console.error('Error writing type definition file:', error);
  }
}

// Run the type generator
generateIconTypes().catch(console.error);
