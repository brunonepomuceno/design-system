import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Size of the icon
   * @default '24px'
   */
  size?: string | number;
  
  /**
   * Variant of the icon
   * @default 'outline'
   */
  variant?: 'outline' | 'filled';
  
  /**
   * Color of the icon
   * @default 'currentColor'
   */
  color?: string;
  
  /**
   * Additional class name for the icon
   */
  className?: string;
  
  /**
   * Title for accessibility
   */
  title?: string;
}

export interface IconMetadata {
  /**
   * Name of the icon (kebab-case)
   */
  name: string;
  
  /**
   * Component name (PascalCase)
   */
  componentName: string;
  
  /**
   * File name (kebab-case)
   */
  fileName: string;
  
  /**
   * Category of the icon (e.g., 'general', 'actions', 'navigation')
   */
  category: string;
  
  /**
   * Tags for easier searching
   */
  tags: string[];
  
  /**
   * Available variants and their sizes
   */
  variants: {
    [variant: string]: {
      [size: string]: string; // size: url
    };
  };
}

export interface IconLibraryConfig {
  /**
   * Figma file key
   */
  fileKey: string;
  
  /**
   * Output directory for SVGs
   */
  outputDir: string;
  
  /**
   * Path to metadata file
   */
  metadataFile: string;
  
  /**
   * Directory for React components
   */
  reactDir: string;
  
  /**
   * Path to CSS file
   */
  cssFile: string;
  
  /**
   * Path to documentation file
   */
  docsFile: string;
  
  /**
   * Available icon sizes
   */
  iconSizes: number[];
  
  /**
   * Available icon variants
   */
  variants: string[];
}
