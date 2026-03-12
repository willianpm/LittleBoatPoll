# Discord Setup

This guide covers the Discord-side configuration required for LittleBoatPoll.

## Create the Discord Application

1. Open https://discord.com/developers/applications.
2. Select `New Application`.
3. Choose a name such as `LittleBoatPoll`.
4. Save the application.

## Create the Bot User

1. Open the `Bot` section in the application.
2. Select `Add Bot`.
3. Copy the bot token.

Keep the token secret. If it is ever exposed, regenerate it immediately.

## Copy the Application ID

In `General Information`, copy the `Application ID` value.

This becomes `CLIENT_ID` in your environment file.

## Configure Gateway Intents

In the `Bot` section, enable the intents required by the runtime.

Required:

- Message Content Intent

Recommended:

- Server Members Intent

The bot also uses standard guild and reaction intents from code, but those do not require special toggles in the Developer Portal.

## Invite the Bot to a Guild

Open the `OAuth2` section and use `URL Generator`.

Scopes:

- `bot`
- `applications.commands`

Recommended permissions:

- View Channels
- Send Messages
- Embed Links
- Add Reactions
- Read Message History
- Use Application Commands
- Manage Messages

Open the generated URL in the browser and authorize the bot in your target guild.

## Capture Required IDs

### Application ID

Use the value from `General Information` as:

```env
CLIENT_ID=your_application_id
```

### Guild ID

Enable Discord Developer Mode and copy the server ID if you need a guild-specific value for dashboard restrictions or manual validation.

## Base Environment File

Example `.env`:

```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
APP_ENV=prod
DEBUG=false
DEPLOY=false
PORT=8000
```

## Optional Dashboard OAuth Setup

If you use the dashboard, configure Discord OAuth2 values in the same application or in a dedicated dashboard application.

Required variables:

```env
DISCORD_CLIENT_ID=your_oauth_client_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback
DASHBOARD_SESSION_SECRET=replace_this_secret
DASHBOARD_ALLOWED_GUILD_ID=your_guild_id
DASHBOARD_FRONTEND_URL=http://localhost:5173
```

The OAuth redirect URI configured in the Discord Developer Portal must exactly match `DISCORD_OAUTH_REDIRECT_URI`.

## Verification Checklist

- [ ] `TOKEN` is copied from the bot section
- [ ] `CLIENT_ID` is copied from general information
- [ ] required intents are enabled
- [ ] the bot has been invited to the guild
- [ ] the environment file exists locally
- [ ] `npm install` completed successfully

## First Runtime Check

Run:

```bash
npm run deploy
npm start
```

Expected outcome:

- the bot logs in successfully
- commands register without API permission errors
- the HTTP server responds on the configured port

## Common Problems

### Invalid token

The token value is incorrect or expired. Regenerate it in the Discord Developer Portal and update the environment file.

### Bot does not come online

Verify `TOKEN`, `CLIENT_ID`, and the enabled intents.

### Missing Access errors

The bot is in the guild but does not have enough channel or server permissions.

### OAuth callback fails

The configured redirect URI in Discord does not match `DISCORD_OAUTH_REDIRECT_URI` exactly.
