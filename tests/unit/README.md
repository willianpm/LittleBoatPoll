# Unit Tests

This directory contains the unit-level Jest coverage for LittleBoatPoll.

## Scope

The unit suite primarily covers shared utilities under `src/utils` and other isolated logic that can be tested without a live Discord runtime.

Current examples include:

- `validators.test.js`
- `draft-handler.test.js`
- `constants.test.js`
- `permissions.test.js`
- `mensalista-binding.test.js`

## Running Tests

Run the full Jest suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

## Adding New Unit Tests

Add files using the `*.test.js` naming pattern and keep the path aligned with the source area being tested.

Example:

```javascript
const { myFunction } = require('../../../src/utils/my-module');

describe('my-module', () => {
  test('returns the expected value', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

## Guidelines

- prefer deterministic tests without network access
- cover edge cases such as empty input, invalid types, and missing fields
- keep test names descriptive enough to explain the expected behavior
- update related documentation when a new testing area is introduced

## Coverage

Coverage thresholds are enforced by the repository test configuration. Use `npm run test:coverage` to inspect current results locally.
