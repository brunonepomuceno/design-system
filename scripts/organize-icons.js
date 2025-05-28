const fs = require('fs').promises;
const path = require('path');

// Configurações
const ICONS_DIR = path.join(__dirname, '../assets/icons');

// Mapeamento de arquivos para suas categorias
const CATEGORIES = {
  // Social
  'facebook.svg': 'social',
  'instagram.svg': 'social',
  'twitter.svg': 'social',
  'youtube.svg': 'social',
  'whatsapp.svg': 'social',
  'linkedin.svg': 'social',
  'comment.svg': 'social',
  'text-message.svg': 'social',
  'verified.svg': 'social',
  
  // Finance
  'pix.svg': 'finance',
  'extract.svg': 'finance',
  'barcode.svg': 'finance',
  'money-exchange.svg': 'finance',
  'key-shining.svg': 'finance',
  'calculator.svg': 'finance',
  'payment.svg': 'finance',
  'receive-money.svg': 'finance',
  'send-money.svg': 'finance',
  'money.svg': 'finance',
  'percentage.svg': 'finance',
  'billing.svg': 'finance',
  'cash-machine.svg': 'finance',
  'wallet.svg': 'finance',
  'credit-card.svg': 'finance',
  'bank.svg': 'finance',
  
  // Technology
  'database.svg': 'technology',
  'data-analysis.svg': 'technology',
  'wifi.svg': 'technology',
};

// Pastas de categoria
const CATEGORY_DIRS = {
  social: path.join(ICONS_DIR, 'social'),
  finance: path.join(ICONS_DIR, 'finance'),
  technology: path.join(ICONS_DIR, 'technology')
};

// Cria as pastas de categoria se não existirem
async function createCategoryDirs() {
  for (const dir of Object.values(CATEGORY_DIRS)) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Pasta criada: ${path.relative(ICONS_DIR, dir)}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error(`❌ Erro ao criar pasta ${dir}:`, err);
        throw err;
      }
    }
  }
}

// Move os arquivos para suas pastas de categoria
async function organizeIcons() {
  console.log('\n🔍 Procurando arquivos para organizar...');
  
  const files = await fs.readdir(ICONS_DIR);
  const svgFiles = files.filter(file => file.endsWith('.svg'));
  
  console.log(`\n📋 Encontrados ${svgFiles.length} arquivos SVG para organizar`);
  
  let movedCount = 0;
  let skippedCount = 0;
  
  for (const file of svgFiles) {
    const category = CATEGORIES[file];
    
    if (!category) {
      console.log(`⚠️  Categoria não encontrada para: ${file}`);
      skippedCount++;
      continue;
    }
    
    const sourcePath = path.join(ICONS_DIR, file);
    const targetDir = CATEGORY_DIRS[category];
    const targetPath = path.join(targetDir, file);
    
    // Verifica se o arquivo já está no local correto
    if (path.dirname(sourcePath) === targetDir) {
      console.log(`⏩ Já está no local correto: ${file} -> ${category}/`);
      skippedCount++;
      continue;
    }
    
    try {
      // Move o arquivo
      await fs.rename(sourcePath, targetPath);
      console.log(`✅ Movido: ${file} -> ${category}/`);
      movedCount++;
    } catch (err) {
      console.error(`❌ Erro ao mover ${file}:`, err.message);
    }
  }
  
  return { moved: movedCount, skipped: skippedCount };
}

// Remove pastas vazias
async function removeEmptyDirs() {
  console.log('\n🧹 Verificando pastas vazias...');
  
  const files = await fs.readdir(ICONS_DIR, { withFileTypes: true });
  const dirs = files.filter(file => file.isDirectory()).map(dir => dir.name);
  
  for (const dir of dirs) {
    const dirPath = path.join(ICONS_DIR, dir);
    const dirContents = await fs.readdir(dirPath);
    
    if (dirContents.length === 0) {
      try {
        await fs.rmdir(dirPath);
        console.log(`🗑️  Pasta vazia removida: ${dir}/`);
      } catch (err) {
        console.error(`❌ Erro ao remover pasta vazia ${dir}:`, err.message);
      }
    }
  }
}

// Função principal
async function main() {
  try {
    console.log('🚀 Iniciando organização dos ícones');
    console.log('='.repeat(50));
    
    // 1. Criar pastas de categoria
    console.log('\n📂 Criando pastas de categoria...');
    await createCategoryDirs();
    
    // 2. Organizar ícones
    console.log('\n🔄 Organizando ícones...');
    const { moved, skipped } = await organizeIcons();
    
    // 3. Remover pastas vazias
    console.log('\n🧼 Limpando...');
    await removeEmptyDirs();
    
    // Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 Relatório de Organização');
    console.log('='.repeat(50));
    console.log(`✅ ${moved} arquivos movidos`);
    console.log(`⏩ ${skipped} arquivos já estavam no local correto`);
    console.log(`📁 Pasta de destino: ${path.resolve(ICONS_DIR)}`);
    console.log('\n🎉 Organização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a organização:', error);
    process.exit(1);
  }
}

// Executa o script
main();
