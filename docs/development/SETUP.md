# Local Setup

This guide covers the minimum local setup for developing LittleBoatPoll.

## Prerequisites

- Node.js 22 or newer
- npm
- Git
- Access to the Discord Developer Portal

## 1. Clone the Repository

```bash
git clone https://github.com/willianpm/LittleBoatPoll.git
cd LittleBoatPoll
```

## 2. Install Dependencies

```bash
npm install
```

If the installation fails because of a corrupted cache:

```bash
npm cache clean --force
npm install
```

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
PORT=8000
```

If you want to use the dashboard locally, also configure:

```env
DISCORD_CLIENT_ID=your_oauth_client_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback
DASHBOARD_SESSION_SECRET=replace_this_secret
DASHBOARD_ALLOWED_GUILD_ID=your_guild_id
DASHBOARD_FRONTEND_URL=http://localhost:5173
DASHBOARD_SINGLE_INSTANCE=true
```

When using `APP_ENV=prod` with the default dashboard session setup, `DASHBOARD_SINGLE_INSTANCE=true` is required.
For production with restarts and/or multiple instances, configure a persistent session store (for example Redis).

For staging, copy `.env.staging.example` to `.env.staging` and use different credentials.

Do not commit real tokens or secrets.

## 4. Verify the Setup

```bash
npm test
```

You can also run the dashboard-specific test suite:

```bash
npm run test:dashboard
```

## 5. Start the Application

Bot runtime:

```bash
npm start
```

Register slash and context commands explicitly:

```bash
npm run deploy
```

Staging runtime:

```bash
npm run start:staging
```

Dashboard frontend in development:

```bash
npm run dashboard:frontend:install
npm run dashboard:frontend:dev
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

### Port `8000` already in use

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
