const fs = require('fs').promises;
const path = require('path');

// Lista de arquivos para verificar e corrigir
const FILES_TO_FIX = [
  'scripts/download-all-icons-advanced.js',
  'scripts/simple-download.js',
  'scripts/download-icons-direct.js',
  'scripts/sync-icons.js',
  'scripts/download-all-icons.js',
  'scripts/check-missing-icons.js',
  'scripts/sync-figma-categories.js',
  'scripts/list-figma-components.js',
  'scripts/get-figma-components.js',
  'scripts/direct-extract.js',
  'scripts/extract-icons-v2.js',
  'scripts/download-vehicles-icons.js',
  'scripts/extract-icons.js',
  'scripts/download-essentials-icons.js',
  'scripts/download-actions-icons.js',
  'scripts/direct-icon-download.js'
];

// Template para a verificação e configuração da chave da API
const API_KEY_CHECK = `// Verifica se a chave da API do Figma está definida
if (!process.env.FIGMA_API_KEY) {
  console.error('❌ Erro: A variável de ambiente FIGMA_API_KEY não está definida.');
  console.error('Por favor, adicione sua chave da API do Figma no arquivo .env');
  process.exit(1);
}
`;

// Padrões para encontrar e substituir
const PATTERNS = [
  {
    // Padrão para arquivos que usam CONFIG.FIGMA_API_KEY
    search: /(const\s+CONFIG\s*=\s*\{[\s\S]*?FIGMA_API_KEY\s*:\s*['"]?)(process\.env\.FIGMA_API_KEY|['"].*?['"])/g,
    replace: '$1process.env.FIGMA_API_KEY',
    insertAfter: 'const CONFIG = {'
  },
  {
    // Padrão para arquivos que usam const FIGMA_API_KEY diretamente
    search: /(const\s+FIGMA_API_KEY\s*=\s*['"]?)(process\.env\.FIGMA_API_KEY|['"].*?['"])/g,
    replace: 'const FIGMA_API_KEY = process.env.FIGMA_API_KEY;',
    insertAfter: null
  }
];

async function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    let modified = false;
    
    // Aplica os padrões de substituição
    for (const pattern of PATTERNS) {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
        
        // Adiciona a verificação da chave da API se necessário
        if (pattern.insertAfter && !content.includes('if (!process.env.FIGMA_API_KEY)')) {
          const insertPos = content.indexOf(pattern.insertAfter) + pattern.insertAfter.length;
          content = content.slice(0, insertPos) + '\n' + API_KEY_CHECK + content.slice(insertPos);
          modified = true;
        }
      }
    }
    
    // Se o arquivo foi modificado, salva as alterações
    if (modified) {
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`✅ ${filePath} atualizado com sucesso`);
      return true;
    }
    
    console.log(`ℹ️  ${filePath} não precisou de alterações`);
    return false;
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando e corrigindo chaves da API do Figma...');
  console.log('='.repeat(70));
  
  let fixedCount = 0;
  
  for (const file of FILES_TO_FIX) {
    const wasFixed = await fixFile(file);
    if (wasFixed) fixedCount++;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 Relatório de Correções');
  console.log('='.repeat(70));
  console.log(`✅ ${fixedCount} arquivos foram atualizados`);
  console.log(`ℹ️  ${FILES_TO_FIX.length - fixedCount} arquivos não precisaram de alterações`);
  
  if (fixedCount > 0) {
    console.log('\n🔐 Todas as chaves da API do Figma foram removidas dos arquivos de código.');
    console.log('   A chave agora está sendo lida apenas do arquivo .env');
  }
  
  console.log('\n🎉 Verificação concluída com sucesso!');
}

// Executa o script
main().catch(console.error);
