const express = require('express');
const crypto = require('crypto');
const { client } = require('../../src/core/client');
const { loadVotacoes } = require('../../src/utils/file-handler');
const { validateDashboardToken } = require('./auth');
const { resolveGuildAndChannel } = require('./utils/guild-channel-resolver');

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

  const cleaned = value
    .replace(/<(?:a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
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
    const emojiFromLegacyId = parseLegacyEmojiId(option?.emoji);
    const emojiValue =
      explicitEmoji?.identifier || textEmoji?.identifier || emojiFromLegacyId?.identifier || emoji || null;
    const emojiMeta =
      parseCustomEmoji(emojiValue) || extractFirstCustomEmoji(emojiValue) || parseLegacyEmojiId(emojiValue);

    return {
      id: option?.id || `active-${index}`,
      text: stripCustomEmojiFromText(optionText),
      votes: votesForOption,
      emoji: emojiValue,
      emojiId: emojiMeta?.emojiId || null,
      emojiAnimated: emojiMeta ? emojiMeta.animated : null,
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

    return res.json({ success: true, poll });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao carregar detalhes da enquete' });
  }
});

module.exports = router;
