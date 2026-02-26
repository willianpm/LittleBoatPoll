# LittleBoatPoll

LittleBoatPoll is a Discord bot for running book club polls with weighted votes (monthly members can have weight 2).

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
