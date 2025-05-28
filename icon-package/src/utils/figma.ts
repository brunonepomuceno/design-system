import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import config from '../../figma.config';

const FIGMA_API_URL = 'https://api.figma.com/v1';

// You'll need to set this environment variable with your Figma personal access token
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_ACCESS_TOKEN) {
  throw new Error('FIGMA_ACCESS_TOKEN environment variable is required');
}

const headers = {
  'X-Figma-Token': FIGMA_ACCESS_TOKEN,
};

export async function getFileNodes(nodeIds?: string[]) {
  const url = `${FIGMA_API_URL}/files/${config.fileKey}/nodes?ids=${nodeIds?.join(',') || ''}`;
  const response = await fetch(url, { headers });
  return response.json();
}

export async function getFile() {
  const url = `${FIGMA_API_URL}/files/${config.fileKey}`;
  const response = await fetch(url, { headers });
  return response.json();
}

export async function getImageUrls(nodeIds: string[], format = 'svg', scale = 1) {
  const ids = nodeIds.join(',');
  const url = `${FIGMA_API_URL}/images/${config.fileKey}?ids=${ids}&format=${format}&scale=${scale}`;
  const response = await fetch(url, { headers });
  return response.json();
}

export async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    fs.writeFile(outputPath, buffer, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function ensureDirectoryExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}
