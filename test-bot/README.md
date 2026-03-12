# Test Bot

This directory contains the Discord-based automation tooling used to validate the staging bot.

## Directory Layout

```text
test-bot/
  .env.test.example
  run-full-tests.js
  run-full-tests.bat
  run-full-tests.sh
  test-runner.js
  AUTOMATION.md
  README.md
```

## Quick Start

1. Copy the example file:

```bash
cp test-bot/.env.test.example test-bot/.env.test
```

PowerShell alternative:

```powershell
Copy-Item test-bot/.env.test.example test-bot/.env.test
```

2. Fill the required values in `test-bot/.env.test`:

- `TEST_BOT_TOKEN`
- `STAGING_BOT_ID`
- `TEST_CHANNEL_ID`
- `TEST_GUILD_ID`

3. Run the automation flow:

```bash
npm run test:full
```

Alternative entry points:

```bash
node test-bot/run-full-tests.js
npm run test:automation
```

## Responsibilities

- `.env.test.example`: example automation configuration
- `run-full-tests.*`: orchestration wrappers for full staging validation
- `test-runner.js`: Discord-based automation scenarios

## Security Notes

Do not commit `test-bot/.env.test` with real credentials.

In CI, use environment secrets for:

- `TEST_BOT_TOKEN`
- `STAGING_BOT_ID`
- `TEST_CHANNEL_ID`
- `TEST_GUILD_ID`

## Related Documentation

See [AUTOMATION.md](AUTOMATION.md) for the full automation guide.
