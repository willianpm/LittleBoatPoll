# Dashboard Integration Guide

This document describes how the dashboard integrates with the bot runtime, how local development is expected to work, and how to test the current API surface.

## Current Integration Model

The dashboard is split into:

- Express routes under `dashboard/api`
- controller and service logic under `dashboard/controllers` and `dashboard/services`
- a React + Vite frontend under `dashboard/frontend`

The main backend process is started from `src/core/index.js`, which mounts the dashboard routes and serves the built frontend in production.

## Authentication and Session Flow

The current authentication model is Discord OAuth2 plus `express-session`.

Flow summary:

1. the frontend redirects the browser to `GET /api/auth/discord/login`
2. Discord redirects back to `GET /api/auth/discord/callback`
3. the backend resolves the authenticated Discord user against guilds currently available to the bot
4. if the user is allowed, the backend stores dashboard state in the session
5. the browser keeps the `dashboard.sid` cookie and uses it on subsequent API calls

Important behavior:

- protected routes validate the session on every request
- access is tied to a guild where the user is recognized as creator, admin, or owner
- the frontend should rely on cookies instead of bearer tokens
- `DASHBOARD_FRONTEND_URL` is used as the post-login redirect target when configured

Relevant routes:

- `GET /api/auth/discord/login`
- `GET /api/auth/discord/callback`
- `GET /api/auth/me`
- `GET /api/auth/guilds`
- `GET /api/auth/guilds/:guildId/members?query=`
- `GET /api/auth/guilds/:guildId/channels`
- `POST /api/auth/logout`

## Command Execution API

Route:

- `POST /api/commands/:commandName`

Authentication:

- session cookie required

Minimal payload example:

```json
{
  "commandType": 1,
  "options": {},
  "guild": { "id": "123" },
  "target": {}
}
```

Related selector endpoints used by the frontend:

- `GET /api/commands/catalog`
- `GET /api/commands/context-targets/polls?guildId=...`
- `GET /api/commands/context-targets/drafts`

The backend builds a Discord-like interaction wrapper and executes the existing command handlers directly. This keeps the dashboard aligned with the same business rules used inside Discord.

## CSV Upload API

Route:

- `POST /api/csv/upload`

Requirements:

- session cookie required
- `multipart/form-data`
- file field name must be `file`
- file size limit is 5 MB

Validation rules:

- only CSV files are accepted
- uploads are stored temporarily in `uploads/`
- the controller reuses the same validation rules used by the bot command flow

Success response:

```json
{
  "success": true
}
```

## CSV Schema

Delimiter:

- `;`

Required columns:

1. `nome-da-enquete`
2. `opcoes`
3. `max_votos`
4. `peso_mensalistas`

Example:

```csv
nome-da-enquete;opcoes;max_votos;peso_mensalistas
Poll A;Option 1,Option 2;2;sim
Poll B;Option X,Option Y,Option Z;1;nao
```

## Frontend Development

Recommended root-level commands:

```bash
npm run dashboard:frontend:install
npm run dashboard:frontend:dev
npm run dashboard:frontend:dev:staging
npm run dashboard:frontend:build
```

Development notes:

- `dashboard:frontend:dev` assumes the backend is available on `http://localhost:8000`
- `dashboard:frontend:dev:staging` proxies to `http://localhost:8001`
- the production build output from `dashboard/frontend/dist` is served by Express

## Backend Health Check

The backend exposes:

- `GET /api/health`

This is useful for verifying which environment is running because the response includes the current `APP_ENV` label.

## Testing

Dashboard route tests are grouped under `dashboard/tests` and run through the root script:

```bash
npm run test:dashboard
```

Current automated coverage includes:

- auth route behavior
- command execution API
- CSV upload API

## Optional Integration Helper

The repository still includes `dashboard/integrationTest.js`, a standalone helper that can run with real services or mock services depending on `USE_MOCK=true`.

Example:

```bash
node dashboard/integrationTest.js
```

This helper is useful for isolated experiments, but it is not the primary dashboard execution path. The main application flow is always routed through the Express API mounted by `src/core/index.js`.

## Recommended Source of Truth

Use the following documentation split to avoid duplication:

- `README.md`: project-level overview and entry points
- `dashboard/README.md`: operational overview of the dashboard module
- `dashboard/INTEGRATION_GUIDE.md`: detailed dashboard integration and testing notes
