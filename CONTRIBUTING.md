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

Deploy commands (automatic on first start):

```bash
npm start          # Full startup with deploy
npm run deploy     # Or use: node index.js --deploy
npm start:quick    # Skip deploy for faster restart
```

Run tests:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

## Code style

- Use consistent formatting with the existing codebase.
- Prefer clear, descriptive variable and function names.
- Avoid unrelated refactors in the same PR.
- Use utility modules in `utils/` for shared logic (file I/O, validation, error handling).
- Add tests for new features or utility functions (Jest).

## Pull request checklist

- [ ] Link the related issue.
- [ ] Explain the change and the impact.
- [ ] **Run `npm test` and ensure all 59 tests pass** (70%+ coverage required).
- [ ] Share test output if new tests were added.
- [ ] Update documentation if behavior changes.
- [ ] Test your changes locally before submitting.

## Reporting issues

Include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs or screenshots if possible
- Bot version (check CHANGELOG.md)

## Testing guidelines

- All utilities in `utils/` should have corresponding tests in `tests/`.
- Use descriptive test names that explain what is being tested.
- Aim for high coverage of edge cases (empty values, null, wrong types, etc.).
- Run `npm run test:coverage` to check coverage before submitting PR.
