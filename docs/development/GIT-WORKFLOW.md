# Git Workflow

This repository follows a GitHub Flow style based on the `develop` branch.

## Branch Strategy

- Base branch for active development: `develop`
- Create short-lived branches from `develop`
- Open pull requests back to `develop`
- Merge after checks and review approval

## Branch Naming

Use descriptive branch names:

- `feature/add-dashboard-filter`
- `bugfix/fix-double-vote-check`
- `docs/update-setup-guide`
- `refactor/simplify-draft-handler`

Avoid vague names such as `test123` or `feature/misc`.

## Local Setup

If needed:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Standard Contribution Flow

1. Sync local `develop`.
2. Create a feature branch.
3. Implement changes and run local checks.
4. Commit with Conventional Commit prefixes.
5. Push and open a pull request.
6. Address CI or review feedback.
7. Merge into `develop` and delete the branch.

## Commands

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-descriptive-change

npm test
npm run lint
npm run format

git add .
git commit -m "feat: add draft option removal guard"
git push -u origin feature/my-descriptive-change
```

## Commit Prefixes

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `test:` tests
- `refactor:` internal refactor with no behavior change
- `perf:` performance improvement

## Pull Request Expectations

- Unit and dashboard tests pass
- Linting and formatting pass
- Scope is focused (one concern per PR)
- Description explains what changed and why

## Common Operations

### Rebase with latest `develop`

```bash
git fetch origin
git rebase origin/develop
git push --force-with-lease
```

### Undo last commit (not pushed)

```bash
git reset --soft HEAD~1
```

### Revert already-pushed commit

```bash
git revert HEAD
git push
```

## Troubleshooting

### `fatal: origin does not appear to be a git repository`

You are likely outside the project directory. Change into the repository root and retry.

### `Your local changes would be overwritten`

Commit or stash your changes before switching branches or rebasing.

## Related Documents

- [SETUP.md](SETUP.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
