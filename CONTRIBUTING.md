# Contributing to Little Boat Poll

Thanks for considering a contribution to the **Little Boat Poll** bot! This document outlines our process for collaborative development.

## Quick Start

1. **Read** [docs/development/SETUP.md](docs/development/SETUP.md) for initial setup
2. **Follow** [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md) for branching & PR process
3. **Test locally** with `npm test` before pushing
4. **Create a PR** to `develop` branch with a clear description

## Before You Start

- **Open an issue** to discuss bugs or features before starting work
- **Keep changes focused:** Each PR should solve one problem
- **No unrelated refactors:** Don't mix cleanup with feature work
- **Read existing code:** Understand patterns before adding new code

## Development Setup

Full setup instructions: [docs/development/SETUP.md](docs/development/SETUP.md)

Quick version:

```bash
npm install
cp .env.example .env          # Fill with your tokens
npm test                       # Verify setup works
```

## Git Workflow

We use **GitHub Flow** (feature branches → develop → main).

**Step-by-step:** [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md)

Quick version:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# ... make changes ...

npm test                       # Must pass!
git add .
git commit -m "[feat] Brief description of change"
git push origin feature/your-feature-name
# Create PR on GitHub
```

## Code Style & Standards

**Validation** happens in two ways:

1. **Local (recommended):** Run the commands below before committing
2. **CI/CD:** On PR - ESLint + Prettier + tests must pass

**Manual checks:**

```bash
npm run lint          # Run ESLint
npm run format        # Auto-format with Prettier
npm run format:check  # Check what would be formatted
```

**Guidelines:**

- Use single quotes (`'`) for strings
- 2-space indentation
- 120 character line limit
- Descriptive variable/function names
- Add type-like comments for complex logic
- Use utility modules in `src/utils/` for shared code

## Project Structure

```
src/
  core/              # Main bot entry point
  commands/          # Slash commands & context menus
    polls/           # Poll-related commands
    users/           # User & mensalista commands
    admin/           # Admin commands
  utils/             # Shared utilities
tests/
  unit/              # Unit tests (mirror src/ structure)
  integration/       # Integration tests
config/              # Configuration files
data/environments/   # Data directories (prod/staging)
docs/development/    # Developer documentation
```

## Testing

**Run all tests:**

```bash
npm test                    # All tests
npm run test:watch          # Watch mode (re-run on file change)
npm run test:coverage       # With coverage report
```

**Requirements:**

- Minimum coverage as enforced by Jest/CI (currently 25% global on branches, functions, lines, statements)
- All tests must pass before PR merge
- Add tests for new utilities or features

**Adding tests:**

- Create mirror path in `tests/unit/` matching `src/` structure
- File follows pattern: `*.test.js`
- Use Jest syntax with clear describe/test blocks

Example:

```javascript
// tests/unit/utils/my-util.test.js
const { myFunction } = require('../../../src/utils/my-util');

describe('myFunction', () => {
  test('should return expected value', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

## Deployment & Releases

**Environments:**

- `develop`: Development/staging (deployed to staging bot)
- `main`: Production (deployed to production bot)

**Release process:**

1. Features merge to `develop`
2. When ready for release: Create PR from `develop` → `main`
3. Update [CHANGELOG.md](CHANGELOG.md) with changes
4. Merge PR to `main` (automatically triggers production deploy)
5. Tag release: `git tag v1.2.3 && git push origin v1.2.3`

## Pull Request Checklist

Before submitting your PR:

- [ ] Created from `develop` branch (not `main`)
- [ ] Branch name follows format: `feature/name` or `bugfix/issue-number`
- [ ] Commit messages are descriptive with prefix: `[feat]`, `[fix]`, `[docs]`, etc.
- [ ] `npm test` passes with 70%+ coverage
- [ ] `npm run lint` passes (or auto-fixed with `npm run format`)
- [ ] Related issue is linked in PR description
- [ ] Documentation is updated if behavior changed
- [ ] No unrelated commits or refactors included

## Reporting Issues

When opening an issue, include:

- **Title:** Clear, concise description
- **Reproduction steps:** How to trigger the problem
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Environment:** Bot version, Discord server type (prod/staging)
- **Screenshots/logs:** If applicable

## Questions or Need Help?

- Open a [GitHub Discussion](https://github.com/../discussions)
- Review existing [documentation](docs/)
- Check [CHANGELOG.md](CHANGELOG.md) for recent changes

---

**Thank you for contributing!** 🚀

- Expected behavior
- Actual behavior
- Logs or screenshots if possible
- Bot version (check CHANGELOG.md)

## Testing guidelines

- All utilities in `utils/` should have corresponding tests in `tests/`.
- Use descriptive test names that explain what is being tested.
- Aim for high coverage of edge cases (empty values, null, wrong types, etc.).
- Run `npm run test:coverage` to check coverage before submitting PR.
