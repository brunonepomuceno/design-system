# 🎨 Guia do Figma MCP Server by Bao To

## 📚 Índice
1. [Introdução](#1-introdução)
2. [Ferramentas e Comandos](#2-ferramentas-e-comandos)
3. [Fluxo de Trabalho](#3-fluxo-de-trabalho)
4. [Casos de Uso](#4-casos-de-uso)
5. [Prompts para IA](#5-prompts-para-ia)
6. [Melhores Práticas](#6-melhores-práticas)
7. [Solução de Problemas](#7-solução-de-problemas)
8. [Recursos Adicionais](#8-recursos-adicionais)
9. [Exemplos de Prompts para IA](#9-exemplos-de-prompts-para-ia)
10. [Extração de Bibliotecas de Ícones](#10-extração-de-bibliotecas-de-ícones)
11. [Dicas de Uso Avançado](#11-dicas-de-uso-avançado)
12. [Solução de Problemas Comuns](#12-solução-de-problemas-comuns)
13. [Recursos Adicionais](#13-recursos-adicionais)

---

## 1. Introdução

O Figma MCP Server by Bao To é um servidor que implementa o Model Context Protocol (MCP) para integrar o Figma com ferramentas de desenvolvimento e assistentes de IA.

### 1.1. O que é?
Um sistema poderoso que conecta seu fluxo de trabalho no Figma com desenvolvimento e documentação técnica, transformando designs em sistemas de design robustos e documentação técnica automaticamente.

### 1.2. Principais Funcionalidades
- Extração de tokens de design (cores, tipografia, espaçamento)
- Geração de documentação de design systems
- Análise de componentes e suas propriedades
- Extração de variáveis do Figma (apenas planos Enterprise)
- Geração de sistemas de design completos
- Verificação de acessibilidade
- Comparação entre versões de design
- Sincronização design-código
- Migração entre formatos de tokens

## 2. Ferramentas e Comandos

### 2.1. Visão Geral
Com o servidor Figma MCP Server by Bao To rodando em background, você pode usar as seguintes ferramentas diretamente, sem precisar incluir a chave de API.

### 2.2. Sobre o prefixo `mcp0_`
O prefixo `mcp0_` é usado para identificar as ferramentas do servidor MCP. Aqui está o que cada parte significa:

- `mcp0`: Identificador do servidor MCP (o número pode variar dependendo de quantos servidores MCP estiverem ativos)
- `_`: Separador
- `nome_da_ferramenta`: Nome da ferramenta específica que você quer usar

Por exemplo, em `mcp0_generate_design_tokens`:
- `mcp0`: Indica que é um comando para o servidor MCP
- `generate_design_tokens`: É a ferramenta específica que gera tokens de design

### 2.3. Comandos Principais

#### 2.3.1. Extração de Dados
```bash
mcp0_generate_design_tokens --fileKey=SEU_FILE_KEY [--includeDeducedVariables] [--outputFilePath=caminho/tokens.json]
```

#### 2.3.2. Download de Imagens
```bash
mcp0_download_figma_images --fileKey=FILE_KEY --localPath=PASTA_DESTINO --nodes '[{"nodeId":"1:23","fileName":"icone.svg"}]'
```

#### 2.3.3. Análise de Componentes
```bash
mcp0_analyze_figma_components --fileKey=FILE_KEY [--outputFilePath=caminho/analise.json]
```

#### 2.3.4. Documentação do Design System
```bash
mcp0_generate_design_system_doc --fileKey=FILE_KEY [--outputDirectoryPath=caminho/documentacao]
```

#### 2.3.5. Comparação de Versões
```bash
mcp0_compare_design_tokens --fileKey1=ARQUIVO_ANTIGO --fileKey2=ARQUIVO_NOVO [--outputFilePath=caminho/comparacao.json]
```

### 2.4. Validação de Design System
```bash
mcp0_validate_design_system --fileKey=FILE_KEY [--outputFilePath=caminho/validacao.json]
```

### 2.5. Verificação de Acessibilidade
```bash
mcp0_check_accessibility --fileKey=FILE_KEY [--outputFilePath=caminho/acessibilidade.json]
```

### 2.6. Migração de Tokens
```bash
mcp0_migrate_tokens --fileKey=FILE_KEY --targetFormat=tailwind|css-variables|style-dictionary|figma-tokens --outputFilePath=caminho/tokens.[json|js|ts]
```

### 2.7. Sincronização Design-Código
```bash
mcp0_check_design_code_sync --fileKey=FILE_KEY --codeTokensPath=caminho/tokens.json [--outputFilePath=caminho/sincronizacao.json]
```

---

## 3. Fluxo de Trabalho

### 3.1. Preparação
- Organize as páginas por funcionalidade
- Defina estilos consistentes
- Documente decisões nos frames
- Use componentes e variantes

### 3.2. Desenvolvimento
- Extraia tokens regularmente
- Gere documentação
- Verifique acessibilidade

### 3.3. Revisão
- Revise os tokens
- Atualize o design
- Documente mudanças

---

## 4. Casos de Uso

### 4.1. Novo Design System
1. Estruture o arquivo Figma
2. Defina cores e tipografia
3. Crie componentes base
4. Extraia tokens iniciais
5. Gere documentação
6. Compartilhe com a equipe

### 4.2. Atualização de Design System
1. Faça alterações no Figma
2. Extraia tokens atualizados
3. Compare versões
4. Atualize documentação
5. Comunique mudanças

### 4.3. Preparação para Desenvolvimento
1. Organize componentes
2. Extraia tokens necessários
3. Gere documentação
4. Compartilhe com devs

---

## 5. Prompts para IA

### 5.1. Em Português

1. **Análise de Arquivo**
   ```
   "Analise o arquivo Figma [LINK] e me dê um resumo dos componentes e estilos encontrados."
   ```

2. **Geração de Tokens**
   ```
   "Gere os tokens de design do arquivo [LINK] e salve como tokens.json na pasta design-tokens/"
   ```

3. **Documentação**
   ```
   "Crie a documentação completa do design system do arquivo [LINK] na pasta docs/design-system/"
   ```

4. **Acessibilidade**
   ```
   "Verifique a acessibilidade do arquivo [LINK] e gere um relatório com os problemas encontrados"
   ```

5. **Sincronização**
   ```
   "Compare os tokens do arquivo Figma [LINK] com os tokens em src/styles/tokens.json e mostre as diferenças"
   ```

### 5.2. Em Inglês

1. **Análise de Arquivo**
   ```
   "Analyze the Figma file [LINK] and provide a summary of components and styles found."
   ```

2. **Geração de Tokens**
   ```
   "Generate design tokens from [LINK] and save as tokens.json in the design-tokens/ folder"
   ```

3. **Documentação**
   ```
   "Create complete design system documentation for [LINK] in the docs/design-system/ folder"
   ```

4. **Acessibilidade**
   ```
   "Check accessibility for file [LINK] and generate a report with any issues found"
   ```

5. **Verificação de Sincronização**
   ```
   "Compare tokens from Figma file [LINK] with tokens in src/styles/tokens.json and show differences"
   ```

## 6. Melhores Práticas

### 6.1. Para Designers
- Use componentes e estilos consistentes
- Dê nomes significativos às camadas e componentes
- Documente as decisões de design diretamente no Figma

### 6.2. Para Desenvolvedores
- Atualize os tokens regularmente
- Use as ferramentas de validação antes de cada release
- Mantenha a documentação sincronizada

### 6.3. Para Times
- Estabeleça um fluxo de trabalho de design system
- Documente as convenções de nomenclatura
- Realize revisões periódicas de acessibilidade

## 7. Solução de Problemas

### 7.1. Erro: Conexão Recusada
```
Erro: Não foi possível conectar ao servidor MCP
```
**Solução:** Verifique se o servidor está rodando com `npx @tothienbao6a0/figma-mcp-server`

### 7.2. Erro: Token Inválido
```
Erro: 401 Unauthorized
```
- Verifique a chave da API
- Confira permissões
- Renove a chave se necessário

### 7.3. Arquivo Não Encontrado
```
Erro: File not found
```
**Solução:** Verifique se o fileKey está correto e se você tem permissão para acessar o arquivo

## 8. Recursos Adicionais

### 8.1. Links Úteis
- [Documentação Oficial do Figma MCP Server](https://www.npmjs.com/package/@tothienbao6a0/figma-mcp-server)
- [Guia de Melhores Práticas de Design System](https://www.figma.com/best-practices/)
- [Diretrizes de Acessibilidade WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/)

## 9. Exemplos de Prompts para IA

### 9.1. Em Português

1. **Extrair Tokens de Design**
   ```
   "Extraia os tokens de design do arquivo do Figma [INSIRA_URL] e salve como design-tokens.json no diretório src/design-tokens/"
   ```

2. **Gerar Documentação**
   ```
   "Gere a documentação completa do design system para o arquivo [INSIRA_URL] e salve na pasta docs/design-system/"
   ```

3. **Analisar Componentes**
   ```
   "Analise os componentes do arquivo [INSIRA_URL] e gere um relatório das propriedades e variantes encontradas"
   ```

4. **Verificar Acessibilidade**
   ```
   "Verifique a acessibilidade do design system no arquivo [INSIRA_URL] e gere um relatório com possíveis problemas"
   ```

5. **Extrair Cores**
   ```
   "Extraia a paleta de cores do arquivo [INSIRA_URL] e gere um arquivo JSON com as cores no formato HSL, RGB e HEX"
   ```

### 9.2. Em Inglês

1. **Extract Design Tokens**
   ```
   "Extract design tokens from the Figma file [INSERT_URL] and save as design-tokens.json in the src/design-tokens/ directory"
   ```

2. **Generate Documentation**
   ```
   "Generate comprehensive design system documentation for the file [INSERT_URL] and save it in the docs/design-system/ folder"
   ```

3. **Analyze Components**
   ```
   "Analyze the components in file [INSERT_URL] and generate a report of the found properties and variants"
   ```

4. **Check Accessibility**
   ```
   "Check the accessibility of the design system in file [INSERT_URL] and generate a report with potential issues"
   ```

5. **Extract Colors**
   ```
   "Extract the color palette from file [INSERT_URL] and generate a JSON file with colors in HSL, RGB, and HEX formats"
   ```

## 10. Extração de Bibliotecas de Ícones

### 10.1. Em Português:
```
"Extraia todos os ícones do arquivo do Figma [INSIRA_URL] e gere um pacote pronto para desenvolvimento. Inclua:
1. Ícones em formato SVG na pasta 'assets/icons/'
2. Um arquivo JSON com metadados dos ícones (nomes, tags, categorias)
3. Um arquivo React que exporte todos os ícones como componentes
4. Um arquivo CSS com classes para cada ícone
5. Um arquivo de documentação em markdown com visualização dos ícones
Certifique-se de que os SVGs estejam otimizados e sem estilos inline desnecessários."
```

### 10.2. Em Inglês:
```
"Extract all icons from the Figma file [INSERT_URL] and generate a development-ready icon package. Include:
1. Icons in SVG format in the 'assets/icons/' folder
2. A JSON file with icon metadata (names, tags, categories)
3. A React file exporting all icons as components
4. A CSS file with classes for each icon
5. A markdown documentation file with icon previews
Ensure SVGs are optimized and free of unnecessary inline styles."
```

### 10.3. Comando direto via CLI:
```bash
npx @tothienbao6a0/figma-mcp-server --figma-api-key=SUA_CHAVE_AQUI analyze-figma-components --fileKey=FILE_KEY --output=icons --format=svg,react,css,json
```

### 10.4. Exemplos Adicionais:

1. **Para ícones em diferentes formatos**:
   ```
   "Extraia os ícones em múltiplos formatos (SVG, PNG 24px, PNG 48px) e organize por tamanho"
   ```

2. **Para ícones com temas**:
   ```
   "Extraia a biblioteca de ícones incluindo todas as variações de tema (light/dark) e estados (default/hover/active)"
   ```

3. **Para ícones com nomenclatura específica**:
   ```
   "Extraia apenas os ícones que começam com 'icon/' no nome e mantenha a estrutura de pastas do Figma"
   ```

## 11. Dicas de Uso Avançado

### 11.1. Para Desenvolvedores
- Use os tokens gerados diretamente no seu código CSS/JS
- Integre com ferramentas como Style Dictionary para gerar código em múltiplas plataformas
- Automatize a geração de documentação em pipelines CI/CD

### 11.2. Para Designers
- Mantenha seu arquivo Figma organizado para melhor extração
- Use estilos consistentes para cores, tipografia e efeitos
- Documente as decisões de design diretamente no Figma

### 11.3. Para Times
- Padronize a nomenclatura de componentes e estilos
- Use a geração automática de documentação para manter todos alinhados
- Implemente revisões de acessibilidade como parte do processo de design

## 12. Solução de Problemas Comuns

### 12.1. Erro de Autenticação
- Verifique se a chave da API do Figma está correta
- Confirme se a chave tem as permissões necessárias
- Renove a chave se necessário

### 12.2. Arquivo Não Encontrado
- Verifique se o File Key está correto
- Confirme se a conta associada à chave tem acesso ao arquivo
- Tente acessar o arquivo pelo navegador primeiro

### 12.3. Erros de Permissão
- Verifique as permissões da chave da API no console do desenvolvedor do Figma
- Garanta que o arquivo não seja privado ou restrito
- Confirme se o plano da sua conta do Figma permite o uso da API

## 13. Recursos Adicionais

### 13.1. Links Importantes
- [Documentação Oficial do Figma API](https://www.figma.com/developers/api)
- [Repositório do Figma MCP Server](https://github.com/tothienbao6a0/Figma-Context-MCP)
- [Guia de Melhores Práticas para Design Systems](https://www.figma.com/best-practices/)

### 13.2. Atualizações
- **Última Atualização:** 25/05/2025
- **Versão do Documento:** 1.0

---

📝 *Para a versão mais recente deste guia, consulte a documentação oficial do Figma MCP Server.*
