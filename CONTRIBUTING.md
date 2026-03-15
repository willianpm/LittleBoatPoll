# Contributing to LittleBoatPoll

This file describes the required, technical steps for contributing to LittleBoatPoll. All documentation references are authoritative; follow linked guides for full details.

## Preconditions

- Docker and Redis are required (see docs/development/SETUP.md).
- All development and tests run inside the project containers.
- Pre-commit hooks: Husky + commitlint (Conventional Commits) are enforced.

## Quick start

1. Read: docs/development/SETUP.md (environment and container commands).
2. Sync develop and create a feature branch (see docs/development/GIT-WORKFLOW.md).
3. Implement changes, add tests, run local checks inside containers.
4. Push branch and open a PR targeting `develop` with a concise description.

## Branching & commits

- Branch from `develop`: `feature/*`, `bugfix/*`, `refactor/*`.
- Use Conventional Commit prefixes: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`.
- Keep PR scope focused: one logical change per PR.

Example local flow:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-descriptive-name
# inside containers: run tests and linters
npm test
npm run lint
git add .
git commit -m "feat: short description"
git push -u origin feature/short-descriptive-name
# open PR -> develop
```

## Tests & CI

- Jest coverage thresholds are enforced by CI; add tests for new logic.
- Run tests inside containers: `docker-compose exec bot npm test` or `npm test` where applicable.
- Use `npm run test:coverage` to view coverage locally.

## Code style & checks

- ESLint and Prettier are enforced in CI.
- Run locally before committing:

```bash
npm run lint
npm run format
npm run format:check
```

- Fix lint/format issues prior to creating a PR.

## Docker / Runtime notes

- Use `docker-compose up --build` for the development environment (see docs/development/SETUP.md).
- Execute runtime and test commands inside the project containers unless otherwise noted.

### Common Docker workflows

#### Build images

```bash
docker build -t littleboatpoll .
docker compose build --no-cache
```

#### Run services

```bash
docker compose up
```

#### Run the image directly (standalone container)

```bash
docker run --env-file .env.staging -p 8001:8001 littleboatpoll
# development
docker run --env-file .env -p 8000:8000 littleboatpoll
```

### Running commands inside containers

Use `docker compose exec <service>` to run commands in a running service container. For example:

```bash
docker compose exec bot npm test
```

## Pull request checklist (minimal)

- [ ] Branch from `develop` (not `main`).
- [ ] PR description explains the change (one short sentence).

## Reporting issues

When opening an issue include:

- Title: short, descriptive.
- Reproduction steps and expected vs actual behavior.
- Environment: bot version, `APP_ENV` or `staging`/`prod` context.
- Relevant logs or screenshots.

## Where to find more details

- Setup and container rules: docs/development/SETUP.md
- Branching and PR expectations: docs/development/GIT-WORKFLOW.md
- Project overview and environment variables: README.md
- Release process and changelog: CHANGELOG.md

---

If you want I can now run a quick pass to remove any remaining Portuguese fragments elsewhere (README, docs) and ensure consistency across docs.
