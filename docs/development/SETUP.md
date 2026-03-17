# Local Setup

This guide covers the required containerized setup for developing and running LittleBoatPoll. Local execution without Docker is not supported.

## Prerequisites

- Docker (required for all environments)
- Redis (required for persistent dashboard sessions)
- Access to the Discord Developer Portal

## 1. Clone the Repository

```bash
git clone https://github.com/willianpm/LittleBoatPoll.git
cd LittleBoatPoll
```

## 2. Install Dependencies

Build and start all services with:

```bash
docker-compose up --build
```

This will start the bot, dashboard, and Redis service for session persistence. All development and testing must be performed inside the containers.

## 3. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

Minimum bot configuration:

```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
APP_ENV=prod
DEBUG=false
DEPLOY=false
PORT=80
```

Dashboard configuration:

```env
DISCORD_CLIENT_ID=your_oauth_client_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost/api/auth/discord/callback
DASHBOARD_SESSION_SECRET=replace_this_secret
DASHBOARD_ALLOWED_GUILD_ID=your_guild_id
DASHBOARD_FRONTEND_URL=http://localhost
DASHBOARD_SINGLE_INSTANCE=true
```

For persistent session management in production, Redis is required:

```env
REDIS_URL=redis://localhost:6379
```

When using `APP_ENV=prod` with the default dashboard session setup, `DASHBOARD_SINGLE_INSTANCE=true` is required.
For production with restarts and/or multiple instances, configure a persistent session store (Redis).

For staging, copy `.env.staging.example` to `.env.staging` and use different credentials.

Do not commit real tokens or secrets.

Pre-commit hooks are enforced via Husky and commitlint. Code style is managed by Prettier and ESLint.
To enable hooks after cloning:

```bash
npx husky install
```

If you encounter issues with commit messages, ensure your commits follow the conventional format enforced by commitlint.

## 4. Verify the Setup

```bash
npm test
```

You can also run the dashboard-specific test suite:

```bash
npm run test:dashboard
```

## 5. Start the Application

All commands must be executed inside the Docker containers. Use `docker-compose` for build, start, and test operations.

```bash
docker-compose up --build
docker-compose exec bot npm test
docker-compose exec dashboard npm run test:dashboard
```

For frontend development, use the dashboard container:

```bash
docker-compose exec dashboard npm run dashboard:frontend:dev
```

## Common Commands

```bash
npm start
npm run deploy
npm run start:staging
npm run deploy:staging
npm test
npm run test:watch
npm run test:coverage
npm run test:dashboard
npm run test:automation
npm run test:full
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Project Layout

```text
src/
   commands/
   core/
   utils/
dashboard/
   api/
   controllers/
   services/
   frontend/
tests/
   unit/
   integration/
docs/
   development/
   technical/
data/
   environments/
```

## Troubleshooting

### Missing `TOKEN` or `CLIENT_ID`

The bot exits during startup if either value is missing from `.env` or `.env.staging`.

### Port `80` already in use

Set a different `PORT` value in your environment file.

### OAuth callback issues

Make sure `DISCORD_OAUTH_REDIRECT_URI` matches the callback configured in the Discord application exactly.

### Frontend cannot reach the backend

Confirm that the backend is running and that the Vite proxy target matches the active backend port.

## Next Reading

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [GIT-WORKFLOW.md](GIT-WORKFLOW.md)
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
- [../../dashboard/README.md](../../dashboard/README.md)
