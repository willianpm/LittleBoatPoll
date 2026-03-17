# LittleBoatPoll

LittleBoatPoll is a Discord bot for book club polls, draft management, internal permissions, and an administrative dashboard. All environments require Docker and Redis.

LittleBoatPoll is a Discord bot for running book club polls with weighted voting, draft management, internal creator permissions, and an administrative dashboard backed by Express and a React frontend.

## Overview

Main components:

- Discord bot (`discord.js`)
- JSON persistence by environment
- Dashboard (OAuth2, session-based access)
- Centralized logger
- Redis for session persistence

## Quick Start

1. Read [docs/development/SETUP.md](docs/development/SETUP.md) for setup and commands.
2. Docker is required. Run:
   - `docker-compose up --build`
3. Configure `.env` (see below).
4. All development and tests occur inside the containers.
5. Contributing: see [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md).

## Requirements

- Docker
- Redis
- Discord bot token and application ID

## Environment Variables

Minimal bot configuration:

```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
DISCORD_CLIENT_ID=your_oauth_client_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost/api/auth/discord/callback
DASHBOARD_SESSION_SECRET=replace_this_secret
DASHBOARD_ALLOWED_GUILD_ID=your_primary_guild_id
DASHBOARD_FRONTEND_URL=http://localhost
DASHBOARD_SINGLE_INSTANCE=true
REDIS_URL=redis://localhost:6379
```

See [docs/development/SETUP.md](docs/development/SETUP.md) for full variable list.

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

## Dashboard

Dashboard: Discord OAuth2, session via Redis. See [dashboard/README.md](dashboard/README.md) for endpoints and frontend details.

## Environments

Environments: `prod` and `staging` (see [docs/technical/staging-bot.md](docs/technical/staging-bot.md)).

## Testing

Testing: unit, dashboard, automation. See [docs/development/SETUP.md](docs/development/SETUP.md) and [test-bot/AUTOMATION.md](test-bot/AUTOMATION.md).

## Documentation Map

See:

- [docs/development/SETUP.md](docs/development/SETUP.md): setup and commands
- [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md): structure and runtime
- [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md): contribution
- [docs/technical/setup-discord.md](docs/technical/setup-discord.md): Discord setup
- [docs/technical/staging-bot.md](docs/technical/staging-bot.md): staging
- [dashboard/README.md](dashboard/README.md): dashboard details
