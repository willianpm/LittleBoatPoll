const { calculateTotalParticipants } = require('../../../src/core/poll-utils');

describe('calculateTotalParticipants', () => {
  test('returns 0 for falsy votes', () => {
    expect(calculateTotalParticipants(null)).toBe(0);
    expect(calculateTotalParticipants(undefined)).toBe(0);
  });

  test('counts keys in votes object', () => {
    const votes = {
      u1: { usuario: 'A' },
      u2: { usuario: 'B' },
      u3: { usuario: 'C' },
    };
    expect(calculateTotalParticipants(votes)).toBe(3);
  });

  test('counts unique userIds in array', () => {
    const votesArray = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u1' }];
    expect(calculateTotalParticipants(votesArray)).toBe(2);
  });
});
