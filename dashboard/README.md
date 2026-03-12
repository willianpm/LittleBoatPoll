# Dashboard

This directory contains the administrative dashboard for LittleBoatPoll.

It includes:

- backend HTTP routes in `api/`
- controller and service layers in `controllers/` and `services/`
- a React + Vite frontend in `frontend/`
- Discord OAuth2 authentication with `express-session`

## Authentication Model

The dashboard uses Discord OAuth2 login and keeps the authenticated session in the `dashboard.sid` HttpOnly cookie.

Protected routes require:

- a valid session
- a guild membership resolved by the bot
- creator, admin, or owner access validated on the backend

The frontend should call protected APIs with browser cookies enabled. It should not send manual bearer tokens.

Auth routes:

- `GET /api/auth/discord/login`
- `GET /api/auth/discord/callback`
- `GET /api/auth/me`
- `GET /api/auth/guilds`
- `GET /api/auth/guilds/:guildId/members?query=`
- `GET /api/auth/guilds/:guildId/channels`
- `POST /api/auth/logout`

## Business Routes

CSV upload:

- endpoint: `POST /api/csv/upload`
- auth: session cookie
- content type: `multipart/form-data`
- required field: `file`

Command execution:

- endpoint: `POST /api/commands/:commandName`
- auth: session cookie
- content type: `application/json`

Catalog and visual selectors:

- `GET /api/commands/catalog`
- `GET /api/commands/context-targets/polls?guildId=...`
- `GET /api/commands/context-targets/drafts`

Health check:

- `GET /api/health`

## CSV Format

The CSV parser expects `;` as the delimiter.

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

## Frontend

The frontend lives in `dashboard/frontend` and uses Vite in development.

Common commands from the repository root:

```bash
npm run dashboard:frontend:install
npm run dashboard:frontend:dev
npm run dashboard:frontend:dev:staging
npm run dashboard:frontend:build
```

In local development, the frontend proxies `/api` to the backend. In production, the built frontend is served by the main Express app.

Current UI flow:

1. choose a guild from visual cards
2. choose a slash or context command from the catalog
3. fill the generated command form

Manual text inputs for guild ID and permission lists are no longer part of the UI flow.

## Environment Variables

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_OAUTH_REDIRECT_URI=...
DASHBOARD_SESSION_SECRET=...
DASHBOARD_ALLOWED_GUILD_ID=...
DASHBOARD_FRONTEND_URL=http://localhost:5173
```

For detailed integration and testing notes, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
