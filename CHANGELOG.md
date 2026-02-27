# Changelog

All notable changes to this project will be documented in this file.

## 1.3.0 - 2026-02-27

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

## 1.2.2 - 2026-02-27

- Rename "Criador" to "Criador de Enquetes" for clarity across the entire project.
- Unify mensalista context menus: combine "Adicionar Mensalista" and "Remover Mensalista" into a single "Add/Del Mensalistas" context menu with toggle functionality.
- Unify criador context menus into "Add/Del Criador de Enquetes" for consistency.
- Use shortened "Add/Del" prefix for context menus to comply with Discord's 32-character name limit.
- Refactor context menu architecture to reduce duplication and improve maintainability.

## 1.2.1 - 2026-02-27

- Add context menu to toggle the "Criador" role for a user.

## 1.2.0 - 2026-02-26

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

## 1.1.0 - 2026-02-25

- Add draft poll system (create, edit, list, show, publish, delete).
- Persist draft polls to disk.
- Add preview before publishing.

## 1.0.0 - 2026-01-01

- Initial release with direct polls, weighted votes, and results summary.
