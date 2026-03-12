# Test Bot Automation

This guide documents the Discord-based automation flow used to validate the staging bot.

## Overview

The automation suite uses a separate Discord bot account to simulate user actions against the staging runtime.

Current goals:

- confirm the staging bot is available in the test guild
- validate that a recent poll message exists and can be interacted with
- verify reaction-based voting behavior
- validate vote removal and basic permission behavior

## Required Configuration

Copy the example file:

```bash
cp test-bot/.env.test.example test-bot/.env.test
```

PowerShell alternative:

```powershell
Copy-Item test-bot/.env.test.example test-bot/.env.test
```

Required values:

- `TEST_BOT_TOKEN`
- `STAGING_BOT_ID`
- `TEST_CHANNEL_ID`
- `TEST_GUILD_ID`

## Test Bot Setup

1. Create a separate Discord application for the test bot.
2. Create the bot user and copy its token.
3. Enable the intents required by the test runner:
   - `Message Content Intent`
   - `Server Members Intent`
4. Invite the test bot to the same guild used by the staging bot.

Recommended permissions:

- View Channels
- Send Messages
- Read Message History
- Add Reactions
- Use Application Commands

## Running the Automation

Recommended full flow:

```bash
npm run test:full
```

This command starts the staging bot, waits for it to become ready, runs the automation suite, and then stops the staging process.

Manual two-terminal flow:

```bash
npm run start:staging
npm run test:automation
```

## Current Scenario Coverage

The current runner validates these areas:

- staging bot presence in the configured guild
- recent bot activity in the configured test channel
- reaction availability on the latest poll-like message
- adding and removing a vote reaction
- basic handling for vote-limit behavior
- permission checks for test bot interaction

The runner searches recent channel history and uses the latest staging bot message with embeds as the working poll candidate.

## Expected Output

The runner prints a scenario-by-scenario console report with pass and fail counts. Failures include short details when available.

## Troubleshooting

### Invalid test bot token

Verify `TEST_BOT_TOKEN` in `test-bot/.env.test`.

### Test channel not found

Verify `TEST_CHANNEL_ID` and confirm the test bot can view the channel.

### No poll message found

Start the staging bot, create a recent poll in the configured channel, and run the suite again.

### Reactions cannot be added or removed

Confirm that both bots have the required channel permissions, especially message history and reaction permissions.

## Extending the Runner

New scenarios should be added in [test-runner.js](test-runner.js) using the existing `recordTest()` pattern and the shared logging helpers.

When adding a new scenario:

1. keep the setup assumptions explicit
2. record both success and failure details
3. avoid leaving noisy test artifacts in the channel when possible
4. update this document if the automation scope changes
