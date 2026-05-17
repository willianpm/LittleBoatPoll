const express = require('express');
const crypto = require('crypto');
const { client } = require('../../src/core/client');
const { loadVotacoes } = require('../../src/utils/file-handler');
const { validateDashboardToken } = require('./auth');
const { resolveGuildAndChannel } = require('./utils/guild-channel-resolver');
const { isUserMensalista } = require('../../src/core/mensalista-runtime');

const router = express.Router();

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function computeTotalVotes(options) {
  return safeArray(options).reduce((sum, option) => sum + (Number(option?.votes || option?.pontos || 0) || 0), 0);
}

function parseCustomEmoji(value) {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/^<(a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>$/);
  if (!match) return null;

  return {
    identifier: match[0],
    emojiId: match[3],
    animated: match[1] === 'a',
  };
}

function parseLegacyEmojiId(value) {
  if (!value || typeof value !== 'string') return null;

  const normalized = value.trim();
  if (!/^\d{17,20}$/.test(normalized)) return null;

  return {
    identifier: `<:emoji:${normalized}>`,
    emojiId: normalized,
    animated: null,
  };
}

function buildDiscordEmojiUrl(emojiId, animated = false) {
  if (!emojiId) return null;

  const extension = animated ? 'gif' : 'webp';
  return `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=64&quality=lossless`;
}

function extractFirstCustomEmoji(value) {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/<(a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>/);
  if (!match) return null;

  return {
    identifier: match[0],
    emojiId: match[3],
    animated: match[1] === 'a',
  };
}

function stripCustomEmojiFromText(value) {
  if (!value || typeof value !== 'string') return '';

  if (parseLegacyEmojiId(value.trim())) {
    return '';
  }

  const cleaned = value
    .replace(/<(?:a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

// Simple concurrency limiter (lightweight pLimit replacement)
function pLimit(concurrency) {
  let active = 0;
  const queue = [];

  const next = () => {
    if (queue.length === 0 || active >= concurrency) return;
    active++;
    const task = queue.shift();
    Promise.resolve()
      .then(task.fn)
      .then((v) => task.resolve(v))
      .catch((err) => task.reject(err))
      .finally(() => {
        active--;
        next();
      });
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
}

function normalizeOption(option, index = 0) {
  if (!option) return null;

  const explicitEmoji =
    parseCustomEmoji(option.emoji) || extractFirstCustomEmoji(option.emoji) || parseLegacyEmojiId(option.emoji);
  const textSource = option.text || option.opcao || option.name || '';
  const textEmoji = extractFirstCustomEmoji(textSource);
  const emojiFromLegacyId = parseLegacyEmojiId(textSource);
  const emojiValue =
    explicitEmoji?.identifier || textEmoji?.identifier || emojiFromLegacyId?.identifier || option.emoji || null;
  const emojiMeta =
    parseCustomEmoji(emojiValue) || extractFirstCustomEmoji(emojiValue) || parseLegacyEmojiId(emojiValue);

  return {
    id: option.id || option.opcao || `option-${index}`,
    text: stripCustomEmojiFromText(textSource),
    votes: Number(option.votes ?? option.pontos ?? 0) || 0,
    emoji: emojiValue,
    emojiId: emojiMeta?.emojiId || null,
    emojiAnimated: emojiMeta ? emojiMeta.animated : null,
    emojiUrl: buildDiscordEmojiUrl(emojiMeta?.emojiId, Boolean(emojiMeta?.animated)),
  };
}

function buildDescription(record) {
  if (record?.description) {
    return record.description;
  }

  const maxVotes = Number(record?.maxVotos || record?.maxVotes || 1) || 1;
  const optionsCount = safeArray(record?.options || record?.opcoes || record?.resultados).length;

  return `Selecione até ${maxVotes} opç${maxVotes > 1 ? 'ões' : 'ão'} em ${optionsCount} opção(ões) disponíveis.`;
}

function hasExpired(endsAt) {
  if (!endsAt) return false;

  const endsAtTime = new Date(endsAt).getTime();
  if (Number.isNaN(endsAtTime)) return false;

  return endsAtTime <= Date.now();
}

function normalizePollFromHistory(record, index = 0) {
  const createdAt = record?.createdAt || record?.dataCriacao || record?.criadoEm || record?.created_at || null;
  const endsAt = record?.endsAt || record?.dataFinalizacao || record?.finalizadaEm || null;
  const optionsSource = safeArray(record?.options || record?.resultados || record?.opcoes);
  const options = optionsSource.map((option, optionIndex) => normalizeOption(option, optionIndex)).filter(Boolean);
  const computedTotalVotes = computeTotalVotes(options);
  const totalVotes = Number(record?.totalVotes || computedTotalVotes || record?.participantes || 0) || 0;
  const resolved = resolveGuildAndChannel({ guildId: record?.guildId || null, channelId: record?.channelId || null });
  const allowMultipleChoices = Boolean(record?.allowMultipleChoices ?? Number(record?.maxVotos || 1) > 1);

  return {
    id: record?.id || record?.messageId || record?.pollId || `history-${index}`,
    title: record?.title || record?.titulo || 'Enquete sem título',
    description: buildDescription({ ...record, options }),
    serverId: record?.guildId || resolved.serverId,
    serverName: record?.serverName || record?.guildName || resolved.serverName,
    channelId: record?.channelId || resolved.channelId,
    channelName: record?.channelName || resolved.channelName || 'canal',
    createdAt,
    endsAt,
    durationKey: record?.durationKey || record?.duracao || null,
    status: record?.status === 'active' || record?.status === 'ativa' ? 'active' : 'ended',
    totalVotes,
    options,
    allowMultipleChoices,
    anonymous: Boolean(record?.anonymous ?? record?.anonima ?? false),
  };
}

function normalizePollFromActive(entry) {
  const poll = entry?.[1] || entry;
  const resolved = resolveGuildAndChannel({ guildId: poll?.guildId || null, channelId: poll?.channelId || null });
  const votes = poll?.votos || {};
  const emojiList = safeArray(poll?.emojiNumeros);
  const isExpired = hasExpired(poll?.endsAt);

  const optionVotes = safeArray(poll?.opcoes).map((option, index) => {
    const emoji = emojiList[index] || null;
    const votesForOption = Object.values(votes).reduce((sum, voteEntry) => {
      const reactions = safeArray(voteEntry?.reacoes);
      return reactions.includes(emoji) ? sum + (Number(voteEntry?.peso || 1) || 1) : sum;
    }, 0);
    const explicitEmoji = parseCustomEmoji(emoji) || extractFirstCustomEmoji(emoji) || parseLegacyEmojiId(emoji);
    const optionText = typeof option === 'string' ? option : option?.text || option?.opcao || option?.name || '';
    const textEmoji = extractFirstCustomEmoji(optionText);
    const legacyEmojiFromText = parseLegacyEmojiId(optionText);
    const emojiFromLegacyId = parseLegacyEmojiId(option?.emoji);
    const emojiValue =
      explicitEmoji?.identifier ||
      textEmoji?.identifier ||
      legacyEmojiFromText?.identifier ||
      emojiFromLegacyId?.identifier ||
      emoji ||
      null;
    const emojiMeta =
      parseCustomEmoji(emojiValue) || extractFirstCustomEmoji(emojiValue) || parseLegacyEmojiId(emojiValue);

    return {
      id: option?.id || `active-${index}`,
      text: stripCustomEmojiFromText(optionText),
      votes: votesForOption,
      emoji: emojiValue,
      emojiId: emojiMeta?.emojiId || null,
      emojiAnimated: emojiMeta ? emojiMeta.animated : null,
      emojiUrl: buildDiscordEmojiUrl(emojiMeta?.emojiId, Boolean(emojiMeta?.animated)),
    };
  });

  return {
    id: poll?.messageId || poll?.id || crypto.randomBytes(4).toString('hex'),
    title: poll?.titulo || poll?.title || 'Enquete sem título',
    description: buildDescription({ ...poll, options: optionVotes }),
    serverId: poll?.guildId || resolved.serverId,
    serverName: poll?.serverName || poll?.guildName || resolved.serverName,
    channelId: poll?.channelId || resolved.channelId,
    channelName: poll?.channelName || resolved.channelName || 'canal',
    createdAt: poll?.criadoEm || poll?.createdAt || null,
    endsAt: poll?.endsAt || null,
    durationKey: poll?.durationKey || null,
    status: isExpired ? 'ended' : 'active',
    totalVotes: computeTotalVotes(optionVotes),
    options: optionVotes,
    allowMultipleChoices: Boolean(poll?.usarPesoMensalista || poll?.maxVotos > 1),
    anonymous: Boolean(poll?.anonymous ?? false),
  };
}

function getPollCollections() {
  const historicalPolls = safeArray(loadVotacoes()).map((record, index) => normalizePollFromHistory(record, index));
  const activePolls = Array.from(client.activePolls?.entries?.() || []).map((entry) => normalizePollFromActive(entry));

  return [...activePolls, ...historicalPolls].sort((left, right) => {
    const leftDate = new Date(left.endsAt || left.createdAt || 0).getTime();
    const rightDate = new Date(right.endsAt || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  });
}

function findActivePollById(pollId) {
  const activeEntries = Array.from(client.activePolls?.entries?.() || []);
  return (
    activeEntries.find(([, p]) => {
      const idCandidates = [p?.messageId, p?.id];
      return idCandidates.some((c) => String(c) === String(pollId));
    }) || null
  );
}

function findHistoryPollById(pollId) {
  const history = safeArray(loadVotacoes());
  return (
    history.find((record) => {
      const idCandidates = [record?.id, record?.messageId, record?.pollId];
      return idCandidates.some((c) => String(c) === String(pollId));
    }) || null
  );
}

async function resolveUserIdentity({ userId, guildId = null, fallbackName = null }) {
  let username = fallbackName || null;
  let displayName = fallbackName || null;

  try {
    const fetchedUser = await client.users?.fetch?.(String(userId)).catch(() => null);
    if (fetchedUser?.username) {
      username = fetchedUser.username;
      displayName = displayName || fetchedUser.globalName || fetchedUser.username;
    }
  } catch {
    // best-effort resolution; keep fallback
  }

  if (guildId) {
    try {
      const guild = client.guilds?.cache?.get?.(String(guildId)) || null;
      const member =
        guild?.members?.cache?.get?.(String(userId)) ||
        (await guild?.members?.fetch?.(String(userId)).catch(() => null));
      if (member) {
        displayName = member.displayName || member.nickname || displayName || username;
        if (!username && member.user?.username) {
          username = member.user.username;
        }
      }
    } catch {
      // best-effort resolution; keep fallback
    }
  }

  return {
    username: username || `user-${String(userId)}`,
    displayName: displayName || username || `Usuário ${String(userId)}`,
  };
}

async function enrichActiveParticipants(rawPoll, normalizedPoll) {
  const votos = rawPoll?.votos || {};
  const participantEntries = Object.entries(votos || {});
  const guild =
    rawPoll?.guild || client.guilds?.cache?.get?.(String(rawPoll?.guildId || normalizedPoll?.serverId || '')) || null;

  // Limit concurrent external Discord API calls to avoid rate limits.
  const limit = pLimit(10);
  const identityCache = new Map();
  const mensalistaCache = new Map();

  const participants = await Promise.all(
    participantEntries.map(([userId, voteEntry]) =>
      limit(async () => {
        let identity;
        if (identityCache.has(userId)) {
          identity = identityCache.get(userId);
        } else {
          identity = await resolveUserIdentity({
            userId,
            guildId: rawPoll?.guildId || normalizedPoll?.serverId || null,
            fallbackName: voteEntry?.usuario || null,
          });
          identityCache.set(userId, identity);
        }

        let isMensalista;
        if (mensalistaCache.has(userId)) {
          isMensalista = mensalistaCache.get(userId);
        } else {
          const mensalistaByWeight = Number(voteEntry?.peso || 1) === 2;
          const mensalistaByCheck = await isUserMensalista(guild, String(userId)).catch(() => false);
          isMensalista = Boolean(mensalistaByWeight || mensalistaByCheck);
          mensalistaCache.set(userId, isMensalista);
        }

        return {
          userId: String(userId),
          username: normalizedPoll?.anonymous ? null : identity.username,
          displayName: normalizedPoll?.anonymous ? null : identity.displayName,
          isMensalista,
          choices: Array.isArray(voteEntry?.reacoes) ? voteEntry.reacoes : [],
          timestamp: voteEntry?.timestamp || null,
        };
      }),
    ),
  );

  const uniqueParticipants = new Set(participants.map((participant) => participant.userId));
  const totalMensalistas = participants.filter((participant) => participant.isMensalista).length;

  return {
    participants,
    totalParticipants: uniqueParticipants.size,
    totalMensalistas,
  };
}

async function enrichHistoryParticipants(historyRecord, normalizedPoll) {
  const participantMap = new Map();
  const resultados = safeArray(historyRecord?.resultados);
  const guild = client.guilds?.cache?.get?.(String(historyRecord?.guildId || normalizedPoll?.serverId || '')) || null;

  for (const option of resultados) {
    const voters = safeArray(option?.votantes);
    const choiceLabel = option?.emoji || option?.opcao || option?.text || null;

    for (const rawUserId of voters) {
      const userId = String(rawUserId);
      if (!participantMap.has(userId)) {
        participantMap.set(userId, {
          userId,
          choices: [],
          timestamp: null,
        });
      }

      if (choiceLabel) {
        participantMap.get(userId).choices.push(choiceLabel);
      }
    }
  }

  // Limit concurrent external Discord API calls and use simple caches
  const limit = pLimit(10);
  const identityCache = new Map();
  const mensalistaCache = new Map();

  const participants = await Promise.all(
    Array.from(participantMap.values()).map((participant) =>
      limit(async () => {
        let identity;
        if (identityCache.has(participant.userId)) {
          identity = identityCache.get(participant.userId);
        } else {
          identity = await resolveUserIdentity({
            userId: participant.userId,
            guildId: historyRecord?.guildId || normalizedPoll?.serverId || null,
            fallbackName: null,
          });
          identityCache.set(participant.userId, identity);
        }

        let isMensalista;
        if (mensalistaCache.has(participant.userId)) {
          isMensalista = mensalistaCache.get(participant.userId);
        } else {
          isMensalista = await isUserMensalista(guild, participant.userId).catch(() => false);
          mensalistaCache.set(participant.userId, isMensalista);
        }

        return {
          userId: participant.userId,
          username: normalizedPoll?.anonymous ? null : identity.username,
          displayName: normalizedPoll?.anonymous ? null : identity.displayName,
          isMensalista: Boolean(isMensalista),
          choices: participant.choices,
          timestamp: null,
        };
      }),
    ),
  );

  const totalParticipants =
    participants.length > 0
      ? participants.length
      : Number(historyRecord?.participantes || normalizedPoll?.totalParticipants || 0) || 0;
  const totalMensalistas = participants.filter((participant) => participant.isMensalista).length;

  return {
    participants,
    totalParticipants,
    totalMensalistas,
  };
}

router.get('/history', validateDashboardToken, async (_req, res) => {
  try {
    return res.json({ success: true, polls: getPollCollections() });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao carregar histórico de enquetes' });
  }
});

router.get('/:pollId', validateDashboardToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    const polls = getPollCollections();
    const poll = polls.find((item) => String(item.id) === String(pollId));

    if (!poll) {
      return res.status(404).json({ success: false, error: 'Enquete não encontrada' });
    }

    // Enrich response with participants for active and historical polls
    try {
      const activeEntry = findActivePollById(pollId);

      if (activeEntry) {
        const enrichedActive = await enrichActiveParticipants(activeEntry[1], poll);
        return res.json({ success: true, poll: { ...poll, ...enrichedActive } });
      }

      const historyRecord = findHistoryPollById(pollId);
      if (historyRecord) {
        const enrichedHistory = await enrichHistoryParticipants(historyRecord, poll);
        return res.json({ success: true, poll: { ...poll, ...enrichedHistory } });
      }

      return res.json({
        success: true,
        poll: { ...poll, participants: [], totalParticipants: 0, totalMensalistas: 0 },
      });
    } catch (err) {
      // If enrichment fails, fall back to the basic poll payload
      // but do not fail the whole request
      console.error('Error enriching poll participants', err);
    }

    return res.json({ success: true, poll });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao carregar detalhes da enquete' });
  }
});

module.exports = router;
