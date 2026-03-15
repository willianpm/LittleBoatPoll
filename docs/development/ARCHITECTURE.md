# Architecture

This document explains the current runtime structure of LittleBoatPoll, including containerized deployment, centralized logging, and persistent session management with Redis.

## High-Level View

```text
Discord interactions and reactions
  |
  v
src/core/index.js
  |
  +-- command loading from src/commands
  +-- in-memory poll and draft state on the Discord client
  +-- JSON persistence through src/utils/file-handler.js
  +-- Centralized logger module for all log output
  +-- Express HTTP server for dashboard and health routes
  |
  +-- dashboard/api/*
    |
    +-- dashboard/controllers/*
    +-- dashboard/services/*
    +-- dashboard/frontend/dist (production build)
    +-- RedisStore for session persistence (production)
```

## Main Runtime Responsibilities

### `src/core/index.js`

The main entry point is responsible for:

- loading `.env` or `.env.staging` depending on `APP_ENV`
- initializing the Discord client
- loading command modules from `src/commands`
- hydrating active polls and drafts from disk
- handling interaction and reaction events
- exposing the Express server, dashboard routes, and `/api/health`
- initializing the centralized logger module (replaces all console.log calls)
- configuring session management:
  - In production, sessions are persisted using RedisStore (requires `REDIS_URL`)
  - In development, sessions use in-memory store

### `src/commands`

Command modules are grouped by domain:

- `src/commands/polls`
- `src/commands/users`
- `src/commands/admin`

Each command reuses shared utilities for validation, permission checks, and persistence instead of reimplementing those rules.

### `src/utils`

Shared modules centralize application concerns:

- `config.js`: environment selection, required variables, file locations, and port settings
- `file-handler.js`: JSON persistence and environment-aware data files
- `validators.js`: poll validation rules
- `permissions.js`: creator and administrative access rules
- `draft-handler.js`: draft lifecycle helpers
- `mensalista-binding.js`: Discord role binding for monthly members
- `error-handler.js`: reusable error formatting and handling helpers

## Repository Structure

test-bot/

```text
src/
  commands/
    admin/
    polls/
    users/
  core/
    client.js
    index.js
  utils/
    logger.js (centralized logger)
dashboard/
  api/
  controllers/
  services/
  tests/
  frontend/
  session/ (RedisStore integration)
docs/
  development/
  technical/
tests/
  integration/
  unit/
data/
  environments/
scripts/

```

## Data Model and Persistence

Persistent JSON files are separated by environment:

```text
data/environments/
  prod/
  staging/
```

Each environment may contain:

- `active-polls.json`
- `draft-polls.json`
- `mensalistas.json`
- `criadores-internos.json`
- `role-bindings.json`
- `historico-votacoes.json`

The bot keeps active polls and drafts in memory during runtime and writes them back through the file handler.

## Poll Lifecycle

### Poll creation

```text
Discord slash command or dashboard request
  -> command handler
  -> validators
  -> permissions
  -> file-handler persistence
  -> in-memory cache update
  -> Discord response or dashboard JSON response
```

### Voting

```text
Discord reaction event
  -> runtime listener in src/core/index.js
  -> active poll lookup
  -> mensalista weight resolution
  -> vote normalization and limits
  -> persistence update
  -> poll message refresh
```

## Dashboard Architecture

The dashboard is not a standalone backend. It is mounted into the main Express app created by the bot runtime.

Important pieces:

- `dashboard/api/auth.js`: Discord OAuth2 flow and session validation
- `dashboard/api/dashboard-commands.js`: command catalog, context target selectors, and command execution bridge
- `dashboard/api/dashboard-csv.js`: CSV upload endpoint
- `dashboard/frontend`: React client for the administrative UI

The dashboard executes the same command logic used by the Discord bot by creating a Discord-like interaction object on the server side.

## Environment Handling

The runtime uses `APP_ENV` to select credentials and data directories.

Behavior:

- `APP_ENV=prod` loads `.env` and `data/environments/prod`
- `APP_ENV=staging` loads `.env.staging` and `data/environments/staging`

Typical commands:

```bash
npm start
npm run start:staging
npm run deploy
npm run deploy:staging
```

## Testing Layout

Automated tests are split across:

- `tests/unit`: utility-focused unit coverage
- `dashboard/tests`: dashboard API coverage
- `test-bot`: automation against a staging bot runtime

Main commands:

```bash
npm test
npm run test:dashboard
npm run test:automation
npm run test:full
```

## Design Constraints

- Command logic should reuse shared utilities rather than duplicating rules.
- File persistence should go through the file handler instead of ad hoc filesystem access.
- Dashboard behavior should stay aligned with the Discord command implementation.
- Environment isolation should be preserved for both credentials and data files.
