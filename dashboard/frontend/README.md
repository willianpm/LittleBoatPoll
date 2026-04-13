# Dashboard Frontend

This package contains the React + Vite frontend for the LittleBoatPoll administrative dashboard.

Repository contribution and branch policy are documented in [../../CONTRIBUTING.md](../../CONTRIBUTING.md) and [../../docs/development/GIT-WORKFLOW.md](../../docs/development/GIT-WORKFLOW.md).

## Local Commands

From `dashboard/frontend`:

```bash
npm install
npm run dev
npm run build
npm run preview
```

From the repository root, the preferred aliases are:

```bash
npm run dashboard:frontend:install
npm run dashboard:frontend:dev
npm run dashboard:frontend:dev:staging
npm run dashboard:frontend:build
```

## Backend Integration

The frontend integrates with the main Express backend through `/api` routes.

Core endpoints:

- `GET /api/auth/discord/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/guilds`
- `POST /api/csv/upload`
- `GET /api/commands/catalog`
- `POST /api/commands/:commandName`

Authentication is session-based. The browser should use cookies rather than manual bearer tokens.

## Development Proxy

In local development, Vite proxies `/api` to the backend target configured in the frontend setup.

- default local backend: `http://localhost:8000`
- staging-oriented frontend proxy: `http://localhost:8001`

For environment setup and runtime details, use [../../docs/development/SETUP.md](../../docs/development/SETUP.md) as the canonical source.

For higher-level dashboard documentation, see [../README.md](../README.md) and [../INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md).
