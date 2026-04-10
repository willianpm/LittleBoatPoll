function shouldAutoClosePoll(poll, nowMs = Date.now()) {
  if (!poll || poll.status !== 'ativa') {
    return false;
  }

  if (!poll.endsAt) {
    return false;
  }

  const endMs = Date.parse(poll.endsAt);
  if (!Number.isFinite(endMs)) {
    return false;
  }

  return endMs <= nowMs;
}

async function closeExpiredPolls(client, closePollFn, options = {}) {
  if (!client || !client.activePolls || typeof closePollFn !== 'function') {
    return { checked: 0, closed: 0, errors: 0 };
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const entries = Array.from(client.activePolls.entries());
  let closed = 0;
  let errors = 0;

  for (const [messageId, poll] of entries) {
    if (!shouldAutoClosePoll(poll, nowMs)) {
      continue;
    }

    try {
      const result = await closePollFn({
        client,
        messageId,
        reason: 'expired',
      });

      if (result?.success) {
        closed++;
      } else {
        errors++;
        if (typeof options.onError === 'function') {
          options.onError(new Error(result?.message || 'Falha ao encerrar enquete expirada'), {
            messageId,
            reason: 'expired',
          });
        }
      }
    } catch (error) {
      errors++;
      if (typeof options.onError === 'function') {
        options.onError(error, { messageId, reason: 'expired' });
      }
    }
  }

  return {
    checked: entries.length,
    closed,
    errors,
  };
}

module.exports = {
  shouldAutoClosePoll,
  closeExpiredPolls,
};
