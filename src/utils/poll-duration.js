const DURATION_MS_BY_KEY = Object.freeze({
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
});

const DEFAULT_DURATION_KEY = '24h';

function isValidDurationKey(durationKey) {
  return typeof durationKey === 'string' && Object.prototype.hasOwnProperty.call(DURATION_MS_BY_KEY, durationKey);
}

function resolveDurationMs(durationKey, fallbackKey = DEFAULT_DURATION_KEY) {
  if (isValidDurationKey(durationKey)) {
    return DURATION_MS_BY_KEY[durationKey];
  }

  if (isValidDurationKey(fallbackKey)) {
    return DURATION_MS_BY_KEY[fallbackKey];
  }

  return null;
}

function calculateEndsAt(startDate, durationKey, fallbackKey = DEFAULT_DURATION_KEY) {
  const startMs = new Date(startDate).getTime();
  if (!Number.isFinite(startMs)) {
    return null;
  }

  const durationMs = resolveDurationMs(durationKey, fallbackKey);
  if (!durationMs) {
    return null;
  }

  return new Date(startMs + durationMs).toISOString();
}

module.exports = {
  DURATION_MS_BY_KEY,
  DEFAULT_DURATION_KEY,
  isValidDurationKey,
  resolveDurationMs,
  calculateEndsAt,
};
