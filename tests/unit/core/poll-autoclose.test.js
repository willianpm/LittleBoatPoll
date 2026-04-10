const { closeExpiredPolls, shouldAutoClosePoll } = require('../../../src/core/poll-autoclose');

describe('poll-autoclose', () => {
  it('should auto-close only active polls with valid endsAt in the past', () => {
    const now = Date.parse('2026-04-10T10:00:00.000Z');

    expect(shouldAutoClosePoll({ status: 'ativa', endsAt: '2026-04-10T09:59:00.000Z' }, now)).toBe(true);
    expect(shouldAutoClosePoll({ status: 'ativa', endsAt: '2026-04-10T10:01:00.000Z' }, now)).toBe(false);
    expect(shouldAutoClosePoll({ status: 'finalizada', endsAt: '2026-04-10T09:59:00.000Z' }, now)).toBe(false);
    expect(shouldAutoClosePoll({ status: 'ativa', endsAt: null }, now)).toBe(false);
    expect(shouldAutoClosePoll({ status: 'ativa', endsAt: 'invalid-date' }, now)).toBe(false);
  });

  it('closes expired polls and ignores non-expired/invalid entries', async () => {
    const activePolls = new Map([
      ['A', { status: 'ativa', endsAt: '2026-04-10T09:00:00.000Z' }],
      ['B', { status: 'ativa', endsAt: '2026-04-10T11:00:00.000Z' }],
      ['C', { status: 'finalizada', endsAt: '2026-04-10T08:00:00.000Z' }],
    ]);

    const closePollFn = jest.fn(async ({ messageId }) => ({ success: messageId === 'A' }));

    const result = await closeExpiredPolls({ activePolls }, closePollFn, {
      nowMs: Date.parse('2026-04-10T10:00:00.000Z'),
    });

    expect(closePollFn).toHaveBeenCalledTimes(1);
    expect(closePollFn).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'A',
        reason: 'expired',
      }),
    );
    expect(result).toEqual({ checked: 3, closed: 1, errors: 0 });
  });
});
