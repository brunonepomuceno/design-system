# 🛠️ Guia do Desenvolvedor - Figma MCP Server

## 1. Configuração Inicial

### Pré-requisitos
- Node.js 16+
- Acesso à API do Figma
- Permissões de leitura no(s) arquivo(s) Figma

### Instalação
```bash
npm install -g @tothienbao6a0/figma-mcp-server
```

### Autenticação
Configure sua chave de API do Figma:
```bash
export FIGMA_API_KEY='sua-chave-aqui'
```

## 2. Comandos Principais

### 2.1. Iniciar o Servidor
```bash
npx @tothienbao6a0/figma-mcp-server
```

### 2.2. Extrair Dados do Figma
```bash
mcp0_get_figma_data --fileKey=FILE_KEY [--nodeId=NODE_ID] [--depth=1]
```

### 2.3. Gerar Tokens de Design
```bash
mcp0_generate_design_tokens --fileKey=FILE_KEY [--outputPath=./tokens.json]
```

### 2.4. Baixar Imagens/Ícones
```bash
mcp0_download_figma_images --fileKey=FILE_KEY --localPath=./assets --nodes '[{"nodeId":"1:23","fileName":"icon.svg"}]'
```

## 3. Integração com Projetos

### 3.1. Com React
Instale o pacote de tokens:
```bash
npm install figma-tokens --save-dev
```

### 3.2. Com Vue.js
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'

export default defineConfig({
  plugins: [
    createVuePlugin(),
    {
      name: 'figma-tokens',
      config() {
        return {
          css: {
            preprocessorOptions: {
              scss: {
                additionalData: `@import "./src/styles/tokens/_variables.scss";`
              }
            }
          }
        }
      }
    }
  ]
})
```

## 4. Automação e CI/CD

### 4.1. GitHub Actions
```yaml
name: Update Design Tokens

on:
  push:
    branches: [ main ]
    paths:
      - 'src/design-tokens/**'

jobs:
  update-tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install -g @tothienbao6a0/figma-mcp-server
      - run: |
          mcp0_generate_design_tokens \
            --fileKey=${{ secrets.FIGMA_FILE_KEY }} \
            --outputPath=./src/design-tokens/tokens.json
      - name: Commit changes
        run: |
          git config --global user.name 'GitHub Action'
          git config --global user.email 'action@github.com'
          git add src/design-tokens/
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "chore: update design tokens" && git push)
```

## 5. Solução de Problemas

### 5.1. Erros Comuns

#### Erro de Autenticação
```
401 Unauthorized
```
**Solução:** Verifique se a chave de API está correta e tem permissões suficientes.

#### Timeout
```
Request timed out
```
**Solução:** Aumente o timeout ou divida a requisição em partes menores.

## 6. Referência da API

### 6.1. mcp0_generate_design_tokens
Gera tokens de design a partir de um arquivo Figma.

**Parâmetros:**
- `--fileKey` (obrigatório): Chave do arquivo Figma
- `--outputPath`: Caminho para salvar os tokens (padrão: ./tokens.json)
- `--includeDeducedVariables`: Inclui variáveis deduzidas (padrão: false)

**Exemplo:**
```bash
mcp0_generate_design_tokens --fileKey=abc123 --outputPath=./src/tokens.json
```

### 6.2. mcp0_download_figma_images
Baixa imagens e ícones do Figma.

**Parâmetros:**
- `--fileKey` (obrigatório): Chave do arquivo Figma
- `--localPath` (obrigatório): Pasta de destino
- `--nodes`: Array de nós em formato JSON

**Exemplo:**
```bash
mcp0_download_figma_images \
  --fileKey=abc123 \
  --localPath=./src/assets/icons \
  --nodes='[{"nodeId":"1:23","fileName":"icon.svg"}]'
```

## 7. Melhores Práticas

1. **Versionamento**
   - Mantenha um histórico de alterações dos tokens
   - Use tags para marcar versões estáveis

2. **Organização**
   - Separe os tokens por categoria (cores, tipografia, espaçamento, etc.)
   - Use nomes semânticos para os tokens

3. **Documentação**
   - Mantenha a documentação atualizada
   - Inclua exemplos de uso para cada token

## 8. Recursos Úteis

- [Documentação Oficial](https://www.npmjs.com/package/@tothienbao6a0/figma-mcp-server)
- [API do Figma](https://www.figma.com/developers/api)
- [Exemplos de Uso](https://github.com/tothienbao98/figma-mcp-server/examples)
