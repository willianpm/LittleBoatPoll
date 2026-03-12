# Staging Bot

This guide explains how to run LittleBoatPoll in an isolated staging environment.

## Purpose

Staging lets you validate features against a real Discord server without touching production data.

The staging setup uses:

- the same source code as production
- separate credentials
- separate JSON data under `data/environments/staging/`
- a separate HTTP port when needed

## Recommended Use Cases

- validate a new command before release
- reproduce production-like issues safely
- run end-to-end tests against a real Discord guild
- verify draft persistence, poll recovery, and permission behavior

## Prerequisites

1. Create a second Discord application for staging at https://discord.com/developers/applications.
2. Create a bot user for that application.
3. Copy the staging bot token and application ID.
4. Invite the staging bot to a dedicated test guild.

Recommended permissions:

- View Channels
- Send Messages
- Embed Links
- Add Reactions
- Read Message History
- Use Application Commands

## Staging Environment File

Create `.env.staging` in the repository root.

Example:

```env
APP_ENV=staging
INSTANCE_ID=staging-local
TOKEN=your_staging_bot_token
CLIENT_ID=your_staging_application_id
DEPLOY=false
DEBUG=true
PORT=8001
```

If you use the dashboard with staging, configure the matching OAuth and session values too.

## Data Isolation

Production and staging keep separate data files:

```text
data/environments/
    prod/
    staging/
```

Typical files in each environment:

- `active-polls.json`
- `draft-polls.json`
- `mensalistas.json`
- `criadores-internos.json`
- `role-bindings.json`
- `historico-votacoes.json`

The runtime selects the correct directory from `APP_ENV`.

## Running Staging

Recommended commands:

```bash
npm run start:staging
npm run deploy:staging
```

Manual alternatives:

Windows PowerShell:

```powershell
$env:APP_ENV="staging"; npm start
```

Windows CMD:

```cmd
set APP_ENV=staging && npm start
```

Linux and macOS:

```bash
APP_ENV=staging npm start
```

## How It Works

The runtime loads `.env.staging` when `APP_ENV=staging`. That changes both credentials and data paths without requiring a second codebase.

Relevant scripts from `package.json`:

- `npm run start:staging`
- `npm run deploy:staging`
- `npm run test:automation`
- `npm run test:full`

## Validation Checklist

Use this checklist before promoting a feature to production.

### Startup and deploy

- [ ] Staging bot comes online in the test guild
- [ ] The startup logs show `STAGING`
- [ ] Commands are available after deployment
- [ ] Files are created under `data/environments/staging/`

### Poll flow

- [ ] `/poll` creates a poll correctly
- [ ] reactions are added automatically
- [ ] vote limits are enforced
- [ ] mensalista weighting works when enabled
- [ ] `/encerrar` or the context action closes the poll correctly

### Draft flow

- [ ] `/draft criar` stores a draft in staging data
- [ ] `/draft listar` shows only staging drafts
- [ ] `/draft publicar` converts the draft into an active poll
- [ ] `/draft excluir` removes the draft cleanly

### Permissions

- [ ] `/criador-de-enquete adicionar` updates `criadores-internos.json`
- [ ] creator-only commands are blocked for unauthorized users
- [ ] mensalista commands behave correctly
- [ ] role binding for `Mensalistas` works if that role exists

### Persistence and recovery

- [ ] active polls survive a restart
- [ ] drafts survive a restart
- [ ] reactions resync correctly after restart
- [ ] votes remain consistent after recovery

## Troubleshooting

### Invalid token

Verify that `TOKEN` in `.env.staging` matches the staging bot token and does not contain extra spaces.

### Commands do not appear

Run:

```bash
npm run deploy:staging
```

If needed, retry with `DEPLOY=true` in `.env.staging` and restart the bot.

### Production data changed by mistake

This usually means the app was started without `APP_ENV=staging`.

Use `npm run start:staging` to avoid manual mistakes and confirm the startup logs before testing.

### Port already in use

Choose a different `PORT` in `.env.staging`.

### JSON file corrupted

Stop the bot, validate the file contents, repair or restore the affected JSON file, and then restart the runtime.

## Promoting to Production

Before releasing:

- confirm the staging checklist passed
- run `npm test`
- run `npm run test:dashboard` if dashboard behavior changed
- run `npm run test:full` when end-to-end behavior needs validation

Production deployment should continue to use `.env` and `data/environments/prod/`.
