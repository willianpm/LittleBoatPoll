# LittleBoatPoll

LittleBoatPoll is a Discord bot for running book club polls with weighted votes.

## Permission Model

The bot uses a **binary permission system**:

- **Criador Role**: Users with the "Criador" role have full access to all bot commands and features.
- **Admins and Server Owner**: Also have full access to all bot commands and features.
- **Regular Users**: Users without the "Criador" role can only vote on active polls through reactions.

There are no intermediate levels, partial permissions, or hierarchies. It's either full access (Criador) or vote-only (regular user).

To ensure commands are visible only to the Criador role (and optionally admins), enable the bot's commands only for those roles in Discord's integration settings.

## Requirements

- Node.js >= 24
- npm
- Discord bot token and application client ID

## Install

```bash
npm install
```

Create a `.env` file in the project root:

```env
TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
```

## Run

Start the bot (automatically registers commands first):

```bash
npm start
```

If you want to skip command registration (faster startup):

```bash
npm run start:quick
```

## Tests

There are no automated tests yet. The `test` script registers commands and starts the bot:

```bash
npm test
```
