function calculateTotalParticipants(votes) {
  if (!votes) return 0;
  if (Array.isArray(votes)) {
    // array of vote objects with userId
    const ids = votes.map((v) => (v && v.userId ? String(v.userId) : null)).filter(Boolean);
    return new Set(ids).size;
  }

  // object keyed by userId
  if (typeof votes === 'object') {
    return Object.keys(votes).length;
  }

  return 0;
}

module.exports = { calculateTotalParticipants };
