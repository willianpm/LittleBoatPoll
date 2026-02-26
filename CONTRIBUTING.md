# Contributing

Thanks for considering a contribution.

## Before you start

- Open an issue to discuss bugs or features.
- Keep changes focused and small when possible.

## Development setup

```bash
npm install
```

Create a `.env` file:

```env
TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
```

Register commands:

```bash
npm run deploy
```

## Code style

- Use consistent formatting with the existing codebase.
- Prefer clear, descriptive variable and function names.
- Avoid unrelated refactors in the same PR.

## Pull request checklist

- [ ] Link the related issue.
- [ ] Explain the change and the impact.
- [ ] Run `npm test` and share any output.
- [ ] Update documentation if behavior changes.

## Reporting issues

Include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs or screenshots if possible
