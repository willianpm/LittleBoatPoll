# Changelog

All notable changes to this project will be documented in this file.

## 2.1.1

### 🐛 Correção: autorização administrativa remota por cargo

- **Corrigido bug em `adminRoleIdsByGuild`:** membros com cargo autorizado voltaram a receber acesso administrativo corretamente em todos os comandos.
- **Compatibilidade ampliada com `interaction.member`:** a verificação de permissões agora aceita tanto `GuildMember` quanto payload de API (`APIInteractionGuildMember`).
- **Permissão de admin robusta:** suporte à leitura de permissões por bitfield (`permissions` string/bigint), além de `member.permissions.has(...)`.
- **Normalização de IDs:** IDs de cargo e usuário agora são normalizados antes da comparação (incluindo casos com menção de cargo), evitando falso negativo.
- **Regressão coberta em teste:** adicionados testes para membro no formato de API e para admin via bitfield.

### ✅ Validação

- Suite completa passando: **71/71 testes**.

## 2.1.0

### ✨ Autorização Administrativa Remota por Cargo

- **Novo campo `adminRoleIdsByGuild`:** possibilidade de autorizar cargos do Discord para acesso administrativo total via arquivo `role-bindings.json`.
- **Configuração remota:** adicione IDs de cargos sem necessidade de comando ou reinicialização do bot.
- **Múltiplos cargos por servidor:** suporte a lista de cargos autorizados por `guildId`.
- **Precedência clara:** sistema verifica na ordem: Admin Discord → Dono do servidor → Criador interno (`criadores-internos.json`) → Cargo autorizado (`adminRoleIdsByGuild`).
- **Sem breaking changes:** toda a funcionalidade anterior mantida; novo campo é opcional.

### 🔧 Melhorias Técnicas

- **`utils/file-handler.js`:** adicionada função `normalizeRoleBindings()` para validação e merge seguro de bindings.
- **`utils/permissions.js`:** adicionadas funções `getAuthorizedAdminRoleIds()` e `hasAuthorizedAdminRole()` para verificação de cargos autorizados.
- **Validação automática:** IDs vazios, duplicados e inválidos são filtrados automaticamente ao carregar dados.
- **Merge não-destrutivo:** `saveRoleBindings()` agora mescla dados novos com existentes, evitando perda de configuração entre features.

### 🧪 Testes

- **Novo arquivo:** `tests/permissions.test.js` com 9 novos testes unitários cobrindo:
  - Autorização por cargo administrativo
  - Fallback para criadorinterno e admin/dono
  - Negação para usuários não autorizados
  - Edge cases (guildId vazio, cache de roles inválido)
- **Suite completa:** 69 testes unitários passando (zero regressões).
- **Testes de integração:** 14 cenários end-to-end validados (100% sucesso).

### 📖 Documentação

- Atualizado `README.md` com instruções de como encontrar IDs de cargo e servidor no Discord.
- Adicionados comentários detalhados em `data/environments/prod/role-bindings.json` e `data/environments/staging/role-bindings.json`.
- Atualizada wiki `permissoes.md` com novo método de autorização (Método 4).
- Atualizado `docs/MIGRACAO-PERMISSOES-INTERNAS.md` com detalhes técnicos da feature v2.1.

### 📋 Exemplos de Uso

```json
{
  "adminRoleIdsByGuild": {
    "771368260633362473": ["1325882022522130606", "9876543210987654321"]
  }
}
```

Membros com qualquer um desses cargos terão **acesso administrativo total** ao bot.

## 2.0.2

### 🏗️ Estrutura: Condensação e Reorganização

- **`test-bot` refatorado em layout plano:** removidas três camadas de subpastas (`config/`, `scripts/`, `automation/`) e centralizados todos os arquivos em `test-bot/`, simplificando a hierarquia.
- **Paths e referências atualizadas:** sincronizados `.gitignore`, `README.md`, `test-bot/README.md`, `test-bot/AUTOMATION.md`, `.github/workflows/test.yml.example` e `package.json` scripts para apontar para novos caminhos.
- **Documentação redundante eliminada:** removido `docs/IMPLEMENTACAO-STAGING.md` (sumário de implementação), mantendo `docs/staging-bot.md` como guia canônico.

### 📖 Documentação: Padronização de Guias de Teste

- **Conversão de formato:** transformados `docs/test-draft-polls.js` e `docs/test-new-commands.js` para `.md` (markdown nativo).
- **Limpeza de código legado:** removidos marcadores de comentário (`//`, `/* */`), blocos wrapper e linhas `console.log`.
- **Padronização visual:** headings e rótulos (`**Comando:**`, `**Resultado:**`, `**Passos:**`) alinhados ao padrão da pasta `docs`.
- **Navegação adicionada:** índices rápidos no topo de ambos os documentos com links para seções de teste.

### 🔧 Código: Refatoração e Deduplicação

- **`test-bot/test-runner.js`:** extração de helpers para polling de enquete, sincronização de reações e provisioning automático.
- **`index.js`:** consolidação de lógica duplicada em vote-limit normalization, reaction payload hydration e command execution paths.
- **Preservação de comportamento:** refatorações mantiveram 100% de compatibilidade — testes unitários passando (60/60).

## 2.0.1

### ✨ Mensalistas: vínculo automático por cargo

- **Binding automático por nome de cargo:** quando existir um cargo chamado `Mensalistas`, o bot vincula automaticamente esse cargo ao papel interno de mensalista.
- **Sem duplicação de cargos:** o bot não cria cargo novo quando `Mensalistas` já existe no servidor.
- **Persistência por servidor:** o mapeamento `guildId -> roleId` é salvo em `role-bindings.json`, evitando reconfiguração após reinício.
- **Fallback seguro:** se o cargo `Mensalistas` não existir, o bot mantém o comportamento padrão por lista interna (`mensalistas.json`) sem quebrar execução.
- **Encerramento de votação ajustado:** a seção "Mensalistas que votaram" agora considera quem efetivamente votou com peso 2.

### 📚 Documentação

- Atualizada documentação principal, wiki e docs internas para refletir o novo comportamento de mensalistas por cargo com persistência.
- Removidas instruções conflitantes sobre dependência/obrigatoriedade de cargos no caso de mensalistas.

## 2.0.0

### 🚀 BREAKING CHANGES: Sistema de Permissões Interno

**Migração completa das permissões administrativas de cargos do Discord para gerenciamento interno.**

#### ✨ Novidades

- **Novo comando `/criador-de-enquete`**: Gerencia criadores de enquetes por ID de usuário
  - `/criador-de-enquete adicionar @usuario` - Adiciona usuário à lista de criadores
  - `/criador-de-enquete remover @usuario` - Remove usuário da lista
  - `/criador-de-enquete listar` - Lista todos os criadores cadastrados
- **Context Menu atualizado**: "Add/Del Criador de Enquetes" agora gerencia permissões internas
- **Novo arquivo de dados**: `criadores-internos.json` - Armazena IDs de usuários com permissões
- **Sistema mais simples**: Não requer criação de cargos no Discord para permissões administrativas
- **Maior segurança**: Permissões não podem ser deletadas acidentalmente
- **Proteção inteligente**: Impede remoção do último criador

#### ⚠️ Breaking Changes

- ❌ **Comando `/criadores` descontinuado**: Agora mostra aviso de migração para `/criador-de-enquete`
- ❌ **Cargos de criador não são mais usados**: Arquivo `cargos-criadores.json` mantido apenas para compatibilidade
- ⚠️ **Requer migração manual**: Usuários com cargo "Criador de Enquetes" devem ser re-adicionados com `/criador-de-enquete adicionar`

#### 📁 Arquivos Modificados

- `utils/permissions.js` - Verifica `criadores-internos.json` em vez de cargos
- `utils/file-handler.js` - Adicionadas funções `loadCriadores()` e `saveCriadores()`
- `commands/criador-de-enquete.js` - **NOVO** comando para gerenciar criadores
- `commands/criadores.js` - **DESCONTINUADO** (mostra aviso)
- `commands/criador-toggle-context.js` - Atualizado para sistema interno

#### 📚 Documentação

- Criado `docs/MIGRACAO-PERMISSOES-INTERNAS.md` - Guia completo de migração
- Atualizado `README.md` - Instruções do novo sistema
- Atualizado `permissoes.md` (wiki) - Documentação completa

#### ✅ Vantagens do Novo Sistema

- ✅ Não precisa criar cargos no servidor Discord para permissões administrativas
- ✅ Sem problemas com hierarquia de cargos
- ✅ Configuração instantânea
- ✅ Mais controle e flexibilidade
- ✅ Logs detalhados de todas as alterações

#### 🔄 Migração

Para migrar de servidores existentes:

1. Identifique usuários com o cargo "Criador de Enquetes"
2. Use `/criador-de-enquete adicionar @usuario` para cada um
3. (Opcional) Delete o cargo antigo do servidor

**Leia:** [Documentação completa de migração](docs/MIGRACAO-PERMISSOES-INTERNAS.md)

---

## 1.4.0

### Infraestrutura de Testes

- **Adicionar testes automatizados:** Implementada suíte de testes abrangente usando Jest.
  - 59 testes unitários cobrindo 100% dos módulos utilitários
  - Testes executados em ~1,3s com limite de cobertura de 70%
  - Scripts de teste: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Documentação de testes:** Adicionado README detalhado no diretório de testes.

### Melhorias de Desempenho

- **Otimizar sincronização de reações de enquete:** Paralelizado o carregamento de reações para reduzir tempo de inicialização em ~50-70%.
  - Eliminadas chamadas duplicadas de API ao Discord
  - Cache de usuários de reação para evitar buscas redundantes
  - Carregar dados de mensalistas uma vez em vez de por enquete
- **Registro melhorado:** Adicionados indicadores de progresso, informações de tempo e emojis de status visuais.

### Documentação

- **Atualizar README:** Refletir as novas capacidades e scripts de teste.
- **Relatório de refatoração:** Consolidada documentação técnica em `/docs`.

### Consolidação

- Inclui todas as melhorias arquitetônicas da v1.3.0 (módulos utilitários, deduplicação de código).

## 1.3.0

### Qualidade de Código e Refatoração

- **Refatoração importante:** Reduzida duplicação de código em 75-87% em toda a base de código.
- **Módulos utilitários criados:**
  - `utils/file-handler.js`: Centraliza todas as operações de entrada/saída de arquivo JSON (9 funções).
  - `utils/validators.js`: Centraliza lógica de validação de enquete (verificação de duplicatas, limites de opções).
  - `utils/constants.js`: Constantes compartilhadas para emojis, cores e limites.
  - `utils/draft-handler.js`: Auxiliares de manipulação de rascunhos.
  - `utils/error-handler.js`: Tratamento de erros padronizado.
- **Arquivos refatorados:** Atualizados 9 arquivos para usar os novos módulos utilitários (index.js, todos os arquivos de comando).
- **Manutenibilidade melhorada:** Eliminados padrões duplicados de entrada/saída de arquivo, lógica de validação e listas de emojis.
- **Documentação:** Adicionado relatório de refatoração técnico abrangente.

## 1.2.2

- Renomear "Criador" para "Criador de Enquetes" para maior clareza em todo o projeto.
- Unificar menus de contexto de mensalista: combinar "Adicionar Mensalista" e "Remover Mensalista" em um único menu de contexto "Adicionar/Remover Mensalistas" com funcionalidade de alternância.
- Unificar menus de contexto de criador em "Adicionar/Remover Criador de Enquetes" para manter consistência.
- Usar prefixo abreviado "Adicionar/Remover" para menus de contexto para estar em conformidade com o limite de 32 caracteres do Discord.
- Refatorar arquitetura de menu de contexto para reduzir duplicação e melhorar manutenibilidade.

## 1.2.1

- Adicionar menu de contexto para alternar a função "Criador de Enquetes" para um usuário.

## 1.2.0

- Adicionar gerenciamento de opções de enquete em rascunho (adicionar/remover opções sem digitar todas as opções novamente).
- Melhorar validações de rascunho (duplicatas, limites, ajustes de votos máximos).
- Corrigir tempos limite de interação para comandos mais lentos.
- Centralizar auxiliares de persistência de rascunho.
- Adicionar menus de contexto: "Adicionar Mensalista", "Remover Mensalista" e "Adicionar/Remover da enquete".
- Tornar respostas de adição/remoção de mensalista efêmeras (privadas para executor de comando).
- Corrigir aviso de descontinuação do Discord.js: migrar de `ephemeral: true` para `flags: MessageFlags.Ephemeral`.
- **Integrar deploy-commands.js em index.js:** Comandos agora são registrados como parte do processo de inicialização do bot principal.
  - Use `npm run deploy` ou `node index.js --deploy` para registrar comandos
  - Processo de implantação é automático na primeira inicialização se a variável de ambiente `DEPLOY=true` estiver configurada
- **Implantação automática ao iniciar:** `npm start` agora sempre implanta comandos antes de iniciar o bot, garantindo que os comandos estejam sempre atualizados.
  - Use `npm run start:quick` para pular a implantação para inicialização mais rápida quando os comandos não foram alterados.

## 1.1.0

- Adicionar sistema de enquete em rascunho (criar, editar, listar, mostrar, publicar, deletar).
- Persistir enquetes em rascunho no disco.
- Adicionar visualização antes de publicar.

## 1.0.0

- Lançamento inicial com enquetes diretas, votos ponderados e resumo de resultados.
