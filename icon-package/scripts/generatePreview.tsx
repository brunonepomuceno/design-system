import fs from 'fs/promises';
import path from 'path';
import { ensureDirectoryExists, getAllFiles } from './utils';

interface IconData {
  name: string;
  content: string;
  category?: string;
}

/**
 * Generate an HTML preview of all icons
 */
async function generatePreview() {
  // Load config
  const config = require('../figma.config');
  const outputDir = path.join(process.cwd(), 'preview');
  const iconsDir = path.join(process.cwd(), 'assets', 'icons');

  try {
    // Ensure directories exist
    await ensureDirectoryExists(iconsDir);
    await ensureDirectoryExists(outputDir);

    // Get all SVG files
    const svgFiles = (await getAllFiles(iconsDir)).filter(file => 
      file.toLowerCase().endsWith('.svg')
    );

    if (svgFiles.length === 0) {
      console.warn('No SVG files found in', iconsDir);
      return;
    }

    console.log(`Found ${svgFiles.length} SVG files for preview`);

    // Process all SVG files
    const icons: IconData[] = await Promise.all(
      svgFiles.map(async (file) => {
        const name = path.basename(file, '.svg');
        const content = await fs.readFile(file, 'utf8');
        return { name, content };
      })
    );

    // Generate the HTML content
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.name} - Icon Preview</title>
  <style>
    :root {
      --primary: #3f51b5;
      --text: #333;
      --border: #e0e0e0;
      --bg: #f5f5f5;
      --card-bg: #fff;
    }
    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6; 
      color: var(--text);
      background: var(--bg);
      padding: 2rem;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
    }
    header { 
      text-align: center; 
      margin-bottom: 2rem; 
    }
    h1 { 
      color: var(--primary); 
      margin-bottom: 0.5rem; 
    }
    .search { 
      max-width: 500px; 
      margin: 0 auto 2rem; 
    }
    input { 
      width: 100%; 
      padding: 0.75rem; 
      border: 2px solid var(--border); 
      border-radius: 4px; 
      font-size: 1rem;
    }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); 
      gap: 1.5rem; 
    }
    .card { 
      background: var(--card-bg); 
      border-radius: 8px; 
      padding: 1.5rem; 
      text-align: center; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .svg { 
      width: 48px; 
      height: 48px; 
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .name { 
      font-weight: 500; 
      word-break: break-word; 
    }
    @media (max-width: 768px) {
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${config.name}</h1>
      <p>${config.description || 'Icon Library Preview'}</p>
    </header>
    
    <div class="search">
      <input type="text" id="search" placeholder="Search icons..." autofocus>
    </div>
    
    <div class="grid" id="icons">
      ${icons.map(icon => `
        <div class="card">
          <div class="svg">
            ${icon.content}
          </div>
          <div class="name">${icon.name}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    document.getElementById('search').addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.card');
      
      cards.forEach(card => {
        const name = card.querySelector('.name').textContent.toLowerCase();
        card.style.display = name.includes(search) ? 'block' : 'none';
      });
    });
  </script>
</body>
</html>`;

    // Write the HTML file
    await fs.writeFile(
      path.join(outputDir, 'index.html'),
      html,
      'utf8'
    );
    
    // Write icons data
    await fs.writeFile(
      path.join(outputDir, 'icons.json'),
      JSON.stringify(icons, null, 2),
      'utf8'
    );
    
    console.log(`✅ Preview generated at ${path.join(outputDir, 'index.html')}`);
  } catch (error) {
    console.error('Error generating preview:', error);
    throw error;
  }
}

// Export the function
export { generatePreview };

// Run if this file is executed directly
if (require.main === module) {
  generatePreview().catch(console.error);
}
