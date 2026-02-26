# Changelog

All notable changes to this project will be documented in this file.

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
