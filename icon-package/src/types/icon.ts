/**
 * Props for the Icon component
 */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Size of the icon in pixels or any valid CSS size value
   * @default '24px'
   */
  size?: string | number;
  
  /**
   * Variant of the icon (e.g., 'outline', 'filled')
   * @default 'outline'
   */
  variant?: 'outline' | 'filled' | string;
  
  /**
   * Color of the icon (uses currentColor by default)
   * @default 'currentColor'
   */
  color?: string;
  
  /**
   * Additional class name for the icon
   */
  className?: string;
}

/**
 * Metadata for an icon
 */
export interface IconMetadata {
  /** Unique identifier for the icon */
  id: string;
  
  /** Name of the icon in kebab-case */
  name: string;
  
  /** Component name in PascalCase */
  componentName: string;
  
  /** File name (without extension) */
  fileName: string;
  
  /** Category of the icon */
  category: string;
  
  /** Tags for better searchability */
  tags: string[];
  
  /** Available variants of the icon */
  variants: {
    [variant: string]: {
      [size: string]: string; // size: fileName
    };
  };
}

/**
 * Collection of icons metadata
 */
export interface IconsMetadata {
  /** When the metadata was generated */
  generatedAt: string;
  
  /** Total number of icons */
  count: number;
  
  /** List of all icons */
  icons: Array<Omit<IconMetadata, 'id'>>;
}
