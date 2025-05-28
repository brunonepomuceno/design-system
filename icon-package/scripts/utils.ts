import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectoryExists(directory: string): Promise<void> {
  try {
    await access(directory);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(directory, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Recursively copy files from one directory to another
 */
export async function copyDirectory(src: string, dest: string): Promise<void> {
  await ensureDirectoryExists(dest);
  
  const entries = await readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * Read a JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write a JSON file with pretty-printing
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const content = JSON.stringify(data, null, 2) + '\n';
  await writeFile(filePath, content, 'utf-8');
}

/**
 * Convert a string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/(^[a-z]|-[a-z])/g, (match) => 
      match.replace(/-/g, '').toUpperCase()
    )
    .replace(/^[a-z]/, (match) => match.toUpperCase());
}

/**
 * Format bytes as a human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all files in a directory recursively
 */
export async function getAllFiles(dirPath: string, fileList: string[] = []): Promise<string[]> {
  const files = await readdir(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Replace content in a file using a callback
 */
export async function replaceInFile(
  filePath: string,
  replaceFn: (content: string) => string
): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  const newContent = replaceFn(content);
  
  if (newContent !== content) {
    await writeFile(filePath, newContent, 'utf-8');
  }
}
