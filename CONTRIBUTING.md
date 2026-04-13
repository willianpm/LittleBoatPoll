# Contributing to LittleBoatPoll

This guide is the short version of how to contribute. For full setup and workflow details, use the linked docs.

## Quick overview

LittleBoatPoll follows GitHub Flow with `master` as the base branch:

- Create a short-lived branch from `master`
- Open a PR targeting `master`
- Get review approval
- Merge only after required checks pass

## Prerequisites

- Node.js `>=22`
- Docker and Redis (see [docs/development/SETUP.md](docs/development/SETUP.md))
- Husky + commitlint enabled via project hooks

## Contribute in 4 steps

1. Sync and branch:

```bash
git checkout master
git pull origin master
git checkout -b feature/short-description
```

2. Implement, test and run checks.

Host workflow (requires local Node.js `>=22`):

```bash
npm test
npm run lint
npm run format:check
```

Container workflow (recommended when following the Docker-only setup):

```bash
docker compose exec bot npm ci --include=dev
docker compose exec bot npm test
docker compose exec bot npm run lint
docker compose exec bot npm run format:check
```

3. Commit with Conventional Commits:

```bash
git commit -m "feat: short description"
```

4. Push branch and open PR to `master`.

## Branches and commits

- Branch prefixes: `feature/*`, `bugfix/*`, `docs/*`, `refactor/*`, `ci/*`, `chore/*`
- Commit types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `ci`, `chore`, `style`
- Keep each PR focused on one logical change

## Required checks

- Tests must pass
- Global coverage threshold must stay at `>=25%` for branches, functions, lines and statements
- `npm run lint` must pass with `--max-warnings=0`
- `npm run format:check` must pass

## Pull request checklist

- [ ] Branch created from `master`.
- [ ] Tests, lint and format checks are passing.
- [ ] PR explains what changed and why.
- [ ] At least one approval was collected.
- [ ] CI checks passed before merge.

## Reporting issues

Include: reproduction steps, expected vs actual behavior, environment (`APP_ENV`/staging/prod), and relevant logs or screenshots.

## More details

- Setup and container rules: [docs/development/SETUP.md](docs/development/SETUP.md)
- Branching and PR expectations: [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md)
- Project overview and environment variables: [README.md](README.md)
