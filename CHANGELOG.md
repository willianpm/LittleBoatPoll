# Changelog

All notable changes to this project will be documented in this file.

## 2.6.0

### New Features

#### Web Dashboard

- Added a full-featured administrative dashboard with React and Vite.
- Integrated Discord OAuth2 authentication for secure access control.
- Optional dashboard login for poll creation and management.
- Session-based authentication with `express-session` and secure cookies.
- Guild-based access validation using Discord member verification.

#### CSV Poll Creation

- Added bulk poll creation via CSV upload.
- Supported CSV format: `;` delimiter with columns `nome-da-enquete`, `opcoes`, `max_votos`, `peso_mensalistas`.
- CSV upload via `POST /api/csv/upload` with multipart form-data.
- Server-side validation of CSV structure and poll constraints.
- Error reporting for invalid or malformed CSV entries.

#### Related Features

- Poll management through web interface.
- View poll status and results in real-time via the dashboard.
- Admin command catalog accessible via dashboard API.
- Dedicated API endpoints for dashboard interaction.

### Code Quality

- Consolidated shared logic across commands into reusable utility modules.
- Improved test coverage to 67+ unit tests across multiple suites.
- Applied consistent ESLint rules with `--max-warnings=0` enforcement.
- Maintained strict Prettier formatting standards.

### Dependencies

Updated core dependencies to latest stable versions:

- `discord.js` ^14.25.1 (up-to-date)
- `express` ^5.2.1 (latest)
- `express-session` ^1.18.2 (new, for dashboard auth)
- `csv-parse` ^6.1.0 (new, for CSV parsing)
- `multer` ^2.1.1 (new, for file uploads)
- `jest` ^30.2.0 (dev, updated)
- `eslint` ^8.56.0 (dev, updated)
- `prettier` ^3.1.0 (dev, updated)

### Documentation

- Added `dashboard/INTEGRATION_GUIDE.md` for integrating the dashboard with external systems.
- Added dashboard README with API and setup instructions.
- Updated main README with quick-start flow and dashboard environment variables.
- Documented OAuth2 environment configuration in detail.
- Added CSV format specification and validation rules.

### Validation

- 100 unit tests across 11 suites, covering core, commands, utils, and dashboard.
- Dashboard integration tests for authentication and CSV uploads.
- No circular dependencies detected.
- All imports validated against the new structure.
- ESLint and Prettier validation passing with zero warnings.

### Breaking Changes

- None. Version 2.6.0 is fully backward-compatible with existing Discord nodes.
- Dashboard is optional; bots can run with or without it.
- Existing installations continue to work without environment changes.

## 2.2.0

### Restructuring

- Reorganized the repository from a flatter layout to a domain-oriented structure.
- Moved commands into `src/commands/admin`, `src/commands/polls`, and `src/commands/users`.
- Centralized shared helpers in `src/utils`.
- Consolidated command loading in `src/core/index.js`.
- Introduced environment-isolated data directories under `data/environments/{prod|staging}` controlled by `APP_ENV`.
- Removed dead code and orphaned imports during the refactor.

### Code Quality

- Enabled strict ESLint execution with `--max-warnings=0`.
- Removed unused imports, variables, and parameters through real refactoring instead of suppression.
- Applied consistent Prettier formatting.
- Kept the changes behavior-preserving.

### CI/CD

- Added `.github/workflows/test.yml` with parallel lint and test jobs.
- Configured Jest coverage threshold enforcement.
- Removed a fragile dependency on `coverage-summary.json`.

### Documentation

- Added the development guides under `docs/development`.
- Standardized the technical documentation under `docs/technical`.
- Updated the README with an improved quick start and current paths.

### Validation

- 67 unit tests passing across 5 suites.
- No circular dependencies detected.
- Imports aligned with the new structure.
- ESLint and Prettier validation passing.

## 2.1.0

### Administrative Authorization

- Added remote role-based authorization with `adminRoleIdsByGuild`.
- Allowed multiple administrative roles per server.
- Improved `normalizeRoleBindings` with safer validation and merge behavior.
- Expanded tests for multi-role and permission scenarios.
- Updated the corresponding documentation.

## 2.0.2

### Repository Condensation

- Flattened the `test-bot` layout and centralized its files in a single directory.
- Updated paths in scripts and documentation to match the new structure.
- Removed redundant staging documentation and kept `docs/technical/staging-bot.md` as the canonical staging guide.

### Documentation Cleanup

- Converted `docs/test-draft-polls.js` and `docs/test-new-commands.js` to Markdown.
- Removed comment wrappers, scaffolding code, and console output from the guides.
- Standardized headings and test instructions.

### Refactoring

- Extracted helpers in `test-bot/test-runner.js` for poll lookup, reaction sync, and provisioning.
- Consolidated duplicated logic in the runtime for vote-limit normalization, reaction hydration, and command execution.
- Preserved behavior while keeping all unit tests passing.

## 2.0.1

### Monthly Member Role Binding

- Automatically binds the Discord role named `Mensalistas` to the internal monthly-member logic.
- Avoids creating duplicate roles when `Mensalistas` already exists.
- Persists the `guildId -> roleId` mapping in `role-bindings.json`.
- Falls back safely to the internal `mensalistas.json` list when the role does not exist.
- Adjusts poll closing output so weighted monthly-member voters are reported correctly.

### Documentation

- Updated the main documentation and wiki to match the new role-binding behavior.
- Removed conflicting guidance about requiring Discord roles for monthly-member support.

## 2.0.0

### Breaking Changes: Internal Permission System

Administrative permissions were migrated from Discord role dependency to an internal permission model.

#### New Features

- Added the `/criador-de-enquete` command to manage poll creators by user ID.
- Updated the creator toggle user context menu to work with internal permissions.
- Added `criadores-internos.json` for persistence.
- Simplified the administrative model so Discord role creation is no longer required.
- Added protection against removing the last remaining creator.

#### Breaking Changes

- `/criadores` was deprecated and now shows a migration notice.
- The old creator-role model is no longer active.
- Existing servers require manual migration of previous creator users.

#### Files and Documentation

- Updated `utils/permissions.js` and `utils/file-handler.js`.
- Added the new command implementation and updated related context menu behavior.
- Added `docs/technical/MIGRACAO-PERMISSOES-INTERNAS.md`.
- Updated the README and wiki pages.

#### Migration

For existing servers:

1. identify users who previously had the creator role
2. re-add them with `/criador-de-enquete adicionar`
3. optionally remove the old Discord role

Read: [Internal permissions migration guide](docs/technical/MIGRACAO-PERMISSOES-INTERNAS.md)

---

## 1.4.0

### Test Infrastructure

- Added a broader Jest-based automated test suite.
- Reached 59 unit tests with full utility coverage at that stage.
- Added test scripts for standard, watch, and coverage execution.
- Added test documentation.

### Performance Improvements

- Optimized poll reaction synchronization during startup.
- Reduced duplicated Discord API calls.
- Reused reaction-user caching.
- Loaded monthly-member data once instead of once per poll.

### Documentation

- Updated the README to reflect the test workflow.
- Consolidated technical documentation under `docs`.

### Consolidation

- Included the architectural improvements introduced in version 1.3.0.

## 1.3.0

### Refactoring and Code Quality

- Reduced duplicated logic substantially across the codebase.
- Added shared utility modules:
  - `utils/file-handler.js`
  - `utils/validators.js`
  - `utils/constants.js`
  - `utils/draft-handler.js`
  - `utils/error-handler.js`
- Updated the main runtime and command files to reuse the new utilities.
- Improved maintainability by centralizing file I/O, validation, and constants.
- Added a technical refactoring report.

## 1.2.2

- Renamed the creator role label throughout the project for clarity.
- Unified the mensalista context menus into a single toggle action.
- Unified the creator context menu for consistency.
- Shortened labels to fit Discord's 32-character context menu limit.
- Refactored context menu architecture to reduce duplication.

## 1.2.1

- Added a context menu action to toggle creator-role access for a user.

## 1.2.0

- Added draft poll option management so options can be added or removed without retyping the full list.
- Improved draft validation for duplicates, limits, and vote-count adjustments.
- Fixed interaction timeout issues for slower commands.
- Centralized draft persistence helpers.
- Added context menus for mensalista and poll-option toggling.
- Made mensalista add and remove responses ephemeral.
- Updated Discord.js ephemeral handling to `flags: MessageFlags.Ephemeral`.
- Integrated command deployment into the main bot startup flow.
- Allowed explicit deployment with `npm run deploy` or `node index.js --deploy`.
- Added automatic deployment on startup when `DEPLOY=true` is configured.

## 1.1.0

- Added the draft poll system with create, edit, list, show, publish, and delete operations.
- Persisted draft polls to disk.
- Added preview support before publishing.

## 1.0.0

- Initial release with direct polls, weighted voting, and result summaries.
