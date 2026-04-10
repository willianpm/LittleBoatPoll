const {
  DEFAULT_DURATION_KEY,
  calculateEndsAt,
  isValidDurationKey,
  resolveDurationMs,
} = require('../../../src/utils/poll-duration');

describe('poll-duration utils', () => {
  it('validates known duration keys', () => {
    expect(isValidDurationKey('1h')).toBe(true);
    expect(isValidDurationKey('24h')).toBe(true);
    expect(isValidDurationKey('3d')).toBe(true);
    expect(isValidDurationKey('foo')).toBe(false);
  });

  it('resolves milliseconds with fallback', () => {
    expect(resolveDurationMs('6h')).toBe(6 * 60 * 60 * 1000);
    expect(resolveDurationMs('invalid')).toBe(24 * 60 * 60 * 1000);
    expect(resolveDurationMs('invalid', 'invalid-too')).toBeNull();
  });

  it('calculates endsAt in UTC ISO', () => {
    const start = '2026-04-10T10:00:00.000Z';
    const endsAt = calculateEndsAt(start, '1h');

    expect(endsAt).toBe('2026-04-10T11:00:00.000Z');
  });

  it('returns null for invalid start date', () => {
    expect(calculateEndsAt('not-a-date', DEFAULT_DURATION_KEY)).toBeNull();
  });
});
