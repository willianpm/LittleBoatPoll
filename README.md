# LittleBoatPoll

LittleBoatPoll is a Discord bot for book club polls, draft management, internal permissions, and an administrative dashboard.

This document provides a project-level overview. Detailed procedures are maintained in dedicated documents to avoid duplication.

## Overview

Main components:

- Discord bot (`discord.js`)
- JSON persistence by environment
- Dashboard (OAuth2, session-based access)
- Centralized logger
- Redis for session persistence

## Source of Truth

Use one canonical document per topic:

- Setup and local runtime: [docs/development/SETUP.md](docs/development/SETUP.md)
- Contribution process and pull request rules: [CONTRIBUTING.md](CONTRIBUTING.md)
- Branching model and Git operations: [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md)
- API contracts: [docs/development/API.md](docs/development/API.md)
- Architecture and runtime responsibilities: [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md)
- Dashboard module overview: [dashboard/README.md](dashboard/README.md)
- Dashboard integration details: [dashboard/INTEGRATION_GUIDE.md](dashboard/INTEGRATION_GUIDE.md)

## Quick Start

1. Read [docs/development/SETUP.md](docs/development/SETUP.md).
2. Start the stack in containers:
   - `docker-compose up --build`
3. Configure `.env` based on `.env.example`.
4. Run development and tests inside containers.
5. Follow contribution rules in [CONTRIBUTING.md](CONTRIBUTING.md).

## Requirements

- Docker
- Redis
- Discord bot token and application ID

## Contribution Flow

The repository uses GitHub Flow with `master` as the canonical base branch.

- Create short-lived branches from `master`
- Open pull requests to `master`
- Merge only after review approval and required checks

Full details and command examples are in [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md).

## Environment variables

The environment variables below reflect the current runtime configuration and are the single source of truth. Always use `.env.example` as the canonical template.

| Variable                     | Required         | Default | Description                                                              |
| ---------------------------- | ---------------- | ------- | ------------------------------------------------------------------------ |
| `APP_ENV`                    | yes              | `prod`  | `prod` or `staging` (switch between `.env` and `.env.staging`).          |
| `TOKEN`                      | yes              |         | Discord bot token.                                                       |
| `CLIENT_ID`                  | yes              |         | Discord bot application ID.                                              |
| `CLIENT_SECRET`              | no               |         | Bot application secret (legacy/compatibility).                           |
| `GUILD_ID`                   | no               |         | Default guild ID used in command execution contexts.                     |
| `REDIS_URL`                  | required in prod |         | Redis URL (session persistence).                                         |
| `REDIS_PASSWORD`             | no               |         | Redis password, if applicable.                                           |
| `DISCORD_CLIENT_ID`          | yes              |         | OAuth2 client ID for dashboard login.                                    |
| `DISCORD_CLIENT_SECRET`      | yes              |         | OAuth2 client secret for dashboard login.                                |
| `DISCORD_OAUTH_REDIRECT_URI` | yes              |         | OAuth2 callback URL, e.g. `http://localhost/api/auth/discord/callback`.  |
| `DASHBOARD_SESSION_SECRET`   | yes              |         | Secret for session cookies.                                              |
| `DASHBOARD_ALLOWED_GUILD_ID` | no               |         | Optional fixed guild ID for dashboard operations.                        |
| `DASHBOARD_FRONTEND_URL`     | yes              |         | Expected dashboard frontend origin.                                      |
| `DASHBOARD_SINGLE_INSTANCE`  | recommended      | `true`  | When using in-memory session store; set `false` only with Redis cluster. |
| `DEPLOY`                     | no               | `false` | Enable deploy startup mode (`node src/core/index.js --deploy`).          |
| `DEBUG`                      | no               | `false` | Enable debug-level logging.                                              |
| `PORT`                       | no               | `8000`  | Express server port inside container.                                    |

### Dashboard frontend URL

- Container mode: `DASHBOARD_FRONTEND_URL=http://localhost` (Docker mapping 80:8000 to local host).
- Vite local dev mode: `DASHBOARD_FRONTEND_URL=http://localhost:5173`.

### Notes

- Production (`APP_ENV=prod`) requires `REDIS_URL` or app exits.
- Non-prod with missing `REDIS_URL` uses in-memory session store (not suitable for multi-instance).
- `DASHBOARD_SINGLE_INSTANCE=true` (recommended for in-memory).

For full setup and additional context, retain [docs/development/SETUP.md](docs/development/SETUP.md).

## Docker Support

Build and run:

```bash
docker-compose up --build
```

Redis is included in the compose setup.

For advanced Docker usage and custom build/run commands, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Logger

Centralized logger replaces all console output with structured log levels and error stack traces.

## CI/CD

CI/CD via GitHub Actions (v4), Docker build, Husky/commitlint, Prettier and ESLint.

## Static Path Correction

Frontend static path uses `/public` in Docker.

Use `.env.staging` for the staging bot if you want isolated credentials and data.

## Main Commands

All commands must be executed inside Docker containers. See [docs/development/SETUP.md](docs/development/SETUP.md) for details.

## Main Scripts

Common `npm` scripts (run from the repository root):

- `start`: start the application (`node src/core/index.js`).
- `dev`: start the application in development mode.
- `deploy`: run deployment startup (`node src/core/index.js --deploy`).
- `dashboard:frontend:dev`: run dashboard frontend in development (useful with Vite).
- `test`: run the full Jest test suite.
- `test:dashboard`: run the dashboard-specific tests.

Run these inside the appropriate Docker container or use `docker-compose exec` to run them in-container.

## Dashboard

Dashboard: Discord OAuth2, session via Redis. See [dashboard/README.md](dashboard/README.md) for endpoints and frontend details.

Poll duration on dashboard: draft creation supports duration keys (`1h`, `6h`, `12h`, `24h`, `3d`, `7d`).
When a draft is published, backend persists `endsAt` (UTC ISO) and polls are auto-closed by scheduler when deadline is reached.

## Environments

Environments: `prod` and `staging` (see [docs/technical/staging-bot.md](docs/technical/staging-bot.md)).

## Testing

Testing: unit, dashboard, automation. See [docs/development/SETUP.md](docs/development/SETUP.md) and [test-bot/AUTOMATION.md](test-bot/AUTOMATION.md).

## Documentation Map

See:

- [docs/development/SETUP.md](docs/development/SETUP.md): setup and commands
- [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md): structure and runtime
- [CONTRIBUTING.md](CONTRIBUTING.md): contribution policy and pull request requirements
- [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md): branch operations and Git examples
- [docs/technical/setup-discord.md](docs/technical/setup-discord.md): Discord setup
- [docs/technical/staging-bot.md](docs/technical/staging-bot.md): staging
- [dashboard/README.md](dashboard/README.md): dashboard details
