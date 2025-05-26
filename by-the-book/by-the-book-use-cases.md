# 🎯 Casos de Uso - Figma MCP Server

## 1. Extração de Biblioteca de Ícones

### 1.1. Preparação no Figma
1. Crie uma página chamada "Ícones"
2. Organize os ícones em frames por categoria
3. Certifique-se de que cada ícone é um componente
4. Nomeie cada componente de forma descritiva (ex: "icon/arrow-right")

### 1.2. Comandos para Extração

#### Extrair todos os ícones como SVG
```bash
mcp0_download_figma_images \
  --fileKey=SEU_FILE_KEY \
  --localPath=./src/assets/icons \
  --nodes='[{"nodeId":"ID_DO_COMPONENTE","fileName":"nome-do-icone.svg"}]'
```

#### Extrair ícones em múltiplos formatos
```bash
# Para cada formato desejado, execute:
mcp0_download_figma_images \
  --fileKey=SEU_FILE_KEY \
  --localPath=./src/assets/icons/png/24px \
  --nodes='[{"nodeId":"ID_DO_COMPONENTE","fileName":"nome-do-icone.png", "format":"png", "scale":1}]'
```

## 2. Geração de Tema de Cores

### 2.1. Estrutura no Figma
1. Crie um frame "Cores"
2. Adicione retângulos com suas cores
3. Crie estilos de cor para cada uma
4. Nomeie seguindo o padrão: `primaria/azul-500`

### 2.2. Comandos
```bash
# Gerar tokens de cores
mcp0_generate_design_tokens \
  --fileKey=SEU_FILE_KEY \
  --outputPath=./src/styles/tokens/colors.json

# Converter para formato CSS
mcp0_migrate_tokens \
  --fileKey=SEU_FILE_KEY \
  --targetFormat=css-variables \
  --outputPath=./src/styles/tokens/colors.css
```

## 3. Documentação do Design System

### 3.1. Estrutura Recomendada
```
📁 docs/
  └── design-system/
      ├── componentes/
      ├── estilos/
      │   ├── cores.md
      │   └── tipografia.md
      └── README.md
```

### 3.2. Comandos
```bash
# Gerar documentação completa
mcp0_generate_design_system_doc \
  --fileKey=SEU_FILE_KEY \
  --outputDirectoryPath=./docs/design-system
```

## 4. Verificação de Acessibilidade

### 4.1. Verificar Contraste
```bash
mcp0_check_accessibility \
  --fileKey=SEU_FILE_KEY \
  --outputPath=./reports/acessibilidade.json
```

### 4.2. O que é verificado
- Contraste de texto/fundo
- Tamanho da fonte
- Espaçamento
- Navegação por teclado
- Textos alternativos

## 5. Sincronização com Código

### 5.1. Verificar Sincronização
```bash
mcp0_check_design_code_sync \
  --fileKey=SEU_FILE_KEY \
  --codeTokensPath=./src/styles/tokens.json \
  --outputPath=./reports/sync-report.json
```

## 6. Exemplos Práticos

### 6.1. Atualizar Todas as Cores
1. Atualize as cores no Figma
2. Gere novos tokens:
   ```bash
   mcp0_generate_design_tokens --fileKey=SEU_FILE_KEY
   ```
3. Atualize a documentação
4. Notifique a equipe

### 6.2. Adicionar Novos Ícones
1. Adicione os ícones no Figma
2. Extraia apenas os novos:
   ```bash
   mcp0_download_figma_images --fileKey=SEU_FILE_KEY --nodes='[...]'
   ```
3. Atualize a documentação

## 7. Automações Úteis

### 7.1. Script para Atualização Completa
```bash
#!/bin/bash

# Atualizar tokens
mcp0_generate_design_tokens --fileKey=$FIGMA_FILE_KEY

# Baixar ícones atualizados
mcp0_download_figma_images --fileKey=$FIGMA_FILE_KEY --nodes='[...]'

# Gerar documentação
mcp0_generate_design_system_doc --fileKey=$FIGMA_FILE_KEY

# Verificar acessibilidade
mcp0_check_accessibility --fileKey=$FIGMA_FILE_KEY

echo "✅ Atualização concluída!"
```

## 8. Fluxo de Trabalho Recomendado

1. **Segunda-feira**: Atualizar tokens e documentação
2. **Quarta-feira**: Revisar acessibilidade
3. **Sexta-feira**: Sincronizar com o time de desenvolvimento

## 9. Dicas de Performance

- Para arquivos grandes, divida a extração em partes
- Use `--nodeId` para extrair seções específicas
- Mantenha o histórico de versões dos tokens

## 10. Recursos Adicionais

- [Documentação Oficial](https://www.npmjs.com/package/@tothienbao6a0/figma-mcp-server)
- [Exemplos de Uso](https://github.com/tothienbao98/figma-mcp-server/examples)
- [Guia de Melhores Práticas](https://www.figma.com/best-practices/)
