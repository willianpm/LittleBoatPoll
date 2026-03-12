# LittleBoatPoll

LittleBoatPoll is a Discord bot for running book club polls with weighted voting, draft management, internal creator permissions, and an administrative dashboard backed by Express and a React frontend.

## Overview

The project combines three main parts:

- A Discord bot built with `discord.js`
- JSON-based persistence isolated by environment (`prod` and `staging`)
- A web dashboard with Discord OAuth2 authentication and session-based access control

Administrative access follows an internal binary permission model:

- Poll creators can manage polls and drafts
- Guild administrators and owners keep full access automatically
- Regular users interact with polls through reactions only

The bot can also bind the Discord role named `Mensalistas` to the internal monthly-member logic. When that role exists, members with the role are recognized automatically and the mapping is persisted in `role-bindings.json`.

## Quick Start

1. Read [docs/development/SETUP.md](docs/development/SETUP.md) for the local setup flow.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill the required variables.
4. Run `npm test`.
5. Start the bot with `npm start`.

If you plan to contribute, also read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md).

## Requirements

- Node.js 22 or newer
- npm
- Discord bot token and application ID

## Environment Variables

The minimum bot configuration is:

```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
```

Dashboard-related variables are required when using OAuth2 login and the administrative UI:

```env
DISCORD_CLIENT_ID=your_oauth_client_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback
DASHBOARD_SESSION_SECRET=replace_this_secret
DASHBOARD_ALLOWED_GUILD_ID=your_primary_guild_id
DASHBOARD_FRONTEND_URL=http://localhost:5173
DASHBOARD_SINGLE_INSTANCE=true
```

`DASHBOARD_SINGLE_INSTANCE=true` is required when running `APP_ENV=prod` with the default in-memory session store.
Use a persistent session store (for example Redis) if you need restarts without logout or horizontal scaling.

Use `.env.staging` for the staging bot if you want isolated credentials and data.

## Main Commands

```bash
npm start
npm run deploy
npm run start:staging
npm run deploy:staging
npm test
npm run test:coverage
npm run test:dashboard
npm run test:automation
npm run test:full
```

Frontend commands for the dashboard live at the repository root as npm aliases:

```bash
npm run dashboard:frontend:install
npm run dashboard:frontend:dev
npm run dashboard:frontend:dev:staging
npm run dashboard:frontend:build
```

## Dashboard

The dashboard uses Discord OAuth2 plus `express-session` with the `dashboard.sid` cookie. Protected routes do not use manual bearer tokens from the frontend.

Main auth endpoints:

- `GET /api/auth/discord/login`
- `GET /api/auth/discord/callback`
- `GET /api/auth/me`
- `GET /api/auth/guilds`
- `GET /api/auth/guilds/:guildId/members?query=`
- `GET /api/auth/guilds/:guildId/channels`
- `POST /api/auth/logout`

Main dashboard endpoints:

- `GET /api/commands/catalog`
- `GET /api/commands/context-targets/polls?guildId=...`
- `GET /api/commands/context-targets/drafts`
- `POST /api/commands/:commandName`
- `POST /api/csv/upload`
- `GET /api/health`

For dashboard-specific details, see [dashboard/README.md](dashboard/README.md).

## Environments

The bot supports isolated production and staging execution:

- `APP_ENV=prod` uses `data/environments/prod/`
- `APP_ENV=staging` uses `data/environments/staging/`

Each environment keeps its own copies of:

- `active-polls.json`
- `draft-polls.json`
- `mensalistas.json`
- `criadores-internos.json`
- `historico-votacoes.json`
- `role-bindings.json`

Recommended staging command:

```bash
npm run start:staging
```

Windows PowerShell alternative:

```powershell
$env:APP_ENV="staging"; npm start
```

Linux and macOS alternative:

```bash
APP_ENV=staging npm start
```

See [docs/technical/staging-bot.md](docs/technical/staging-bot.md) for the full staging guide.

## Testing

The repository contains unit, dashboard, and automation coverage.

Unit and coverage commands:

```bash
npm test
npm run test:watch
npm run test:coverage
```

Dashboard API tests:

```bash
npm run test:dashboard
```

End-to-end automation against the staging bot:

```bash
npm run test:full
```

Manual two-terminal automation flow:

```bash
npm run start:staging
npm run test:automation
```

Detailed automation guidance is available in [test-bot/AUTOMATION.md](test-bot/AUTOMATION.md).

## Documentation Map

- [docs/development/SETUP.md](docs/development/SETUP.md): local setup and common development commands
- [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md): codebase structure and runtime flow
- [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md): contribution workflow
- [docs/technical/setup-discord.md](docs/technical/setup-discord.md): Discord application setup
- [docs/technical/staging-bot.md](docs/technical/staging-bot.md): staging environment guide
- [docs/technical/MIGRACAO-PERMISSOES-INTERNAS.md](docs/technical/MIGRACAO-PERMISSOES-INTERNAS.md): internal permissions migration history
- [dashboard/README.md](dashboard/README.md): dashboard API and frontend overview
