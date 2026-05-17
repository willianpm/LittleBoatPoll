# API Reference

This document describes the HTTP API exposed by the LittleBoatPoll backend (bot + dashboard).

## Common behavior

- Base path: `/api`
- JSON body: `application/json` for most endpoints
- Dashboard routes require a valid `dashboard.sid` session cookie and Discord OAuth session.
- Error responses use JSON: `{ "success": false, "error": "..." }` (dashboard commands) or `{ "error": "..." }` for auth routes.

## Health

- Method: `GET`
- Path: `/api/health`
- Auth: none
- Response: `200` text `Bot Online! [ENV]`

## Authentication

### Login redirect

- Method: `GET`
- Path: `/api/auth/discord/login`
- Auth: none
- Response: HTTP redirect to Discord OAuth URL
- Errors: `500` when OAuth config is missing (JSON contains `missing` array)

### OAuth callback

- Method: `GET`
- Path: `/api/auth/discord/callback`
- Auth: none
- Response: HTTP redirect to dashboard frontend with `?auth=` query parameter
- Errors: redirect with `?auth=invalid_state|forbidden|error`

### Current session

- Method: `GET`
- Path: `/api/auth/me`
- Auth: session cookie
- Response: `200` JSON
  - `{ "authenticated": true, "user": { ... } }`
- Errors: `401`, `403` with JSON `{ "error": "...", "authenticated": false }`

### Guild list

- Method: `GET`
- Path: `/api/auth/guilds`
- Auth: session cookie
- Response: `200` JSON: `{ "guilds": [ { id,name,icon,isActive }, ... ] }`

### Guild members

- Method: `GET`
- Path: `/api/auth/guilds/:guildId/members`
- Query: `query` optional text filter
- Auth: session cookie
- Response: `200` JSON: `{ "members": [ ... ] }`
- Errors: `403`, `404`, `500`

### Guild channels

- Method: `GET`
- Path: `/api/auth/guilds/:guildId/channels`
- Auth: session cookie
- Response: `200` JSON: `{ "channels": [ ... ] }`
- Errors: `403`, `404`, `500`

### Group members

- Method: `GET`
- Path: `/api/auth/guilds/:guildId/group-members`
- Query: `group=mensalistas|criadores`
- Auth: session cookie
- Response: `200` JSON: `{ "ids": [ ... ] }`
- Errors: `400`, `403`, `500`

### Logout

- Method: `POST`
- Path: `/api/auth/logout`
- Auth: session cookie
- Response: `200` JSON: `{ "success": true }`

## Dashboard command APIs

### Command catalog

- Method: `GET`
- Path: `/api/commands/catalog`
- Auth: session cookie
- Response: `200` JSON: `{ "success": true, "message": "...", "commands": [ ... ] }`

### Context polls

- Method: `GET`
- Path: `/api/commands/context-targets/polls`
- Query: `guildId` optional
- Auth: session cookie
- Response: `200` JSON: `{ "success": true, "message": "...", "polls": [ ... ] }`

### Context drafts

- Method: `GET`
- Path: `/api/commands/context-targets/drafts`
- Auth: session cookie
- Response: `200` JSON: `{ "success": true, "message": "...", "drafts": [ ... ] }`

### Execute command

- Method: `POST`
- Path: `/api/commands/:commandName`
- Auth: session cookie
- Body example:

```json
{
  "options": { ... },
  "guild": { "id": "..." },
  "commandType": 1,
  "target": { "channelId": "..." }
}
```

- Success: `200` JSON `{ "success": true, "message": "..." }`
- Errors:
  - `400` invalid type or payload
  - `403` unauthorized guild
  - `404` command not found / guild not connected
  - `429` command locked
  - `503` bot offline
  - `500` internal error

### Poll duration contract (dashboard)

- `POST /api/commands/rascunho` with subcommand `criar` accepts `options.values.duracao`.
- Allowed values: `1h`, `6h`, `12h`, `24h`, `3d`, `7d`.
- If omitted, backend defaults to `24h` for dashboard-created drafts.
- On `rascunho publicar`, backend computes `endsAt` in UTC ISO and persists it with the active poll record.
- Active poll lifecycle:
  - `status: ativa` while `now < endsAt`
  - auto-close when `now >= endsAt`
  - result is persisted in history with `status: ended`, `dataFinalizacao`, `endsAt`, `durationKey`, `closeReason`
- Auto-close execution:
  - periodic scheduler every 30 seconds
  - startup sweep after reaction sync to close already expired polls
  - close path is idempotent to avoid double-close races with manual context command

## CSV upload

- Method: `POST`
- Path: `/api/csv/upload`
- Auth: session cookie
- Content type: `multipart/form-data`
- Form field: `file` (CSV file)
- `CSV` parser expects semicolon delimiter: `nome-da-enquete;opcoes;max_votos;peso_mensalistas`
- Success: `200` JSON with result from upload controller
- Errors: `400`, `413` file too big, `500` internal

## Errors and logs

- All routes log errors either in console (initial boot) or through structured logger in production.
- Dashboard controller responses use `{ "success": false, "error": "..." }`.

## Additional resources

- `docs/development/SETUP.md` (environment and commands)
- `docs/development/ARCHITECTURE.md` (overall architecture)
- `dashboard/README.md` (dashboard domain details)

## Poll detail extension

- Method: `GET`
- Path: `/api/polls/:pollId`
- Auth: dashboard session
- Response: `200` JSON `{ "success": true, "poll": { ... } }`

The poll detail payload may include analytics fields for active and ended polls:

- `participants`: an array of participant objects when available. Each participant object contains:
  - `userId`: string
  - `username`: string | null (may be null for anonymous votes)
  - `displayName`: string | null (may be null for anonymous votes)
  - `isMensalista`: boolean
  - `choices`: string[] (list of emoji identifiers the user voted for)
  - `timestamp`: ISO datetime string | null

- `totalParticipants`: integer, the number of unique userIds who voted in the poll.
- `totalMensalistas`: integer, the number of mensalistas among participants.

Note: For polls marked `anonymous`, participant names are redacted according to privacy flags. The API exposes `participants`, `totalParticipants` and `totalMensalistas` when available; when enrichment is not possible the endpoint may return an empty `participants` array and appropriate totals according to stored data.
