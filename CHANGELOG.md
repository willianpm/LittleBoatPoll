# Changelog

All notable changes to this project will be documented in this file.

## 2.0.1 - 2026-02-27

### ✨ Mensalistas: vínculo automático por cargo

- **Binding automático por nome de cargo:** quando existir um cargo chamado `Mensalistas`, o bot vincula automaticamente esse cargo ao papel interno de mensalista.
- **Sem duplicação de cargos:** o bot não cria cargo novo quando `Mensalistas` já existe no servidor.
- **Persistência por servidor:** o mapeamento `guildId -> roleId` é salvo em `role-bindings.json`, evitando reconfiguração após reinício.
- **Fallback seguro:** se o cargo `Mensalistas` não existir, o bot mantém o comportamento padrão por lista interna (`mensalistas.json`) sem quebrar execução.
- **Encerramento de votação ajustado:** a seção "Mensalistas que votaram" agora considera quem efetivamente votou com peso 2.

### 📚 Documentação

- Atualizada documentação principal, wiki e docs internas para refletir o novo comportamento de mensalistas por cargo com persistência.
- Removidas instruções conflitantes sobre dependência/obrigatoriedade de cargos no caso de mensalistas.

## 2.0.0 - 2026-02-27

### 🚀 BREAKING CHANGES: Sistema de Permissões Interno

**Migração completa das permissões administrativas de cargos do Discord para gerenciamento interno.**

#### ✨ Novidades

- **Novo comando `/criador`**: Gerencia criadores de enquetes por ID de usuário
  - `/criador adicionar @usuario` - Adiciona usuário à lista de criadores
  - `/criador remover @usuario` - Remove usuário da lista
  - `/criador listar` - Lista todos os criadores cadastrados
- **Context Menu atualizado**: "Add/Del Criador de Enquetes" agora gerencia permissões internas
- **Novo arquivo de dados**: `criadores-internos.json` - Armazena IDs de usuários com permissões
- **Sistema mais simples**: Não requer criação de cargos no Discord para permissões administrativas
- **Maior segurança**: Permissões não podem ser deletadas acidentalmente
- **Proteção inteligente**: Impede remoção do último criador

#### ⚠️ Breaking Changes

- ❌ **Comando `/criadores` descontinuado**: Agora mostra aviso de migração para `/criador`
- ❌ **Cargos de criador não são mais usados**: Arquivo `cargos-criadores.json` mantido apenas para compatibilidade
- ⚠️ **Requer migração manual**: Usuários com cargo "Criador de Enquetes" devem ser re-adicionados com `/criador adicionar`

#### 📁 Arquivos Modificados

- `utils/permissions.js` - Verifica `criadores-internos.json` em vez de cargos
- `utils/file-handler.js` - Adicionadas funções `loadCriadores()` e `saveCriadores()`
- `commands/criador.js` - **NOVO** comando para gerenciar criadores
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
2. Use `/criador adicionar @usuario` para cada um
3. (Opcional) Delete o cargo antigo do servidor

**Leia:** [Documentação completa de migração](docs/MIGRACAO-PERMISSOES-INTERNAS.md)

---

## 1.4.0

### Testing Infrastructure

- **Add automated testing:** Implemented comprehensive test suite using Jest.
  - 59 unit tests covering 100% of utility modules
  - Tests run in ~1.3s with 70% coverage threshold
  - Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Test documentation:** Added detailed README in tests directory.

### Performance Improvements

- **Optimize poll reaction sync:** Parallelized reaction fetching to reduce startup time by ~50-70%.
  - Eliminated duplicate API calls to Discord
  - Cache reaction users to avoid redundant fetches
  - Load mensalistas data once instead of per-poll
- **Enhanced logging:** Added progress indicators, timing info, and visual status emojis.

### Documentation

- **Update README:** Reflect new testing capabilities and scripts.
- **Refactoring report:** Consolidated technical documentation in `/docs`.

### Consolidation

- Includes all architectural improvements from v1.3.0 (utility modules, code deduplication).

## 1.3.0

### Code Quality & Refactoring

- **Major refactoring:** Reduced code duplication by 75-87% across the entire codebase.
- **Created utility modules:**
  - `utils/file-handler.js`: Centralized all JSON file I/O operations (9 functions).
  - `utils/validators.js`: Centralized poll validation logic (duplicate checks, option limits).
  - `utils/constants.js`: Shared constants for emojis, colors, and limits.
  - `utils/draft-handler.js`: Draft manipulation helpers.
  - `utils/error-handler.js`: Standardized error handling.
- **Refactored files:** Updated 9 files to use new utility modules (index.js, all command files).
- **Improved maintainability:** Eliminated duplicated file I/O patterns, validation logic, and emoji lists.
- **Documentation:** Added comprehensive technical refactoring report.

## 1.2.2

- Rename "Criador" to "Criador de Enquetes" for clarity across the entire project.
- Unify mensalista context menus: combine "Adicionar Mensalista" and "Remover Mensalista" into a single "Add/Del Mensalistas" context menu with toggle functionality.
- Unify criador context menus into "Add/Del Criador de Enquetes" for consistency.
- Use shortened "Add/Del" prefix for context menus to comply with Discord's 32-character name limit.
- Refactor context menu architecture to reduce duplication and improve maintainability.

## 1.2.1

- Add context menu to toggle the "Criador" role for a user.

## 1.2.0

- Add draft poll option management (add/remove options without retyping all options).
- Improve draft validations (duplicates, limits, max votes adjustments).
- Fix interaction timeouts for slower commands.
- Centralize draft persistence helpers.
- Add context menus: "Adicionar Mensalista", "Remover Mensalista", and "Adicionar/Remover da enquete".
- Make mensalista add/remove responses ephemeral (private to command executor).
- Fix Discord.js deprecation warning: migrate from `ephemeral: true` to `flags: MessageFlags.Ephemeral`.
- **Integrate deploy-commands.js into index.js:** Commands are now registered as part of the main bot startup process.
  - Use `npm run deploy` or `node index.js --deploy` to register commands
  - Deploy process is automatic on first startup if `DEPLOY=true` environment variable is set
- **Auto-deploy on start:** `npm start` now always deploys commands before starting the bot, ensuring commands are always up-to-date.
  - Use `npm run start:quick` to skip deployment for faster startup when commands haven't changed.

## 1.1.0

- Add draft poll system (create, edit, list, show, publish, delete).
- Persist draft polls to disk.
- Add preview before publishing.

## 1.0.0

- Initial release with direct polls, weighted votes, and results summary.
