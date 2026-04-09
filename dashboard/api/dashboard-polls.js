const express = require('express');
const crypto = require('crypto');
const { client } = require('../../src/core/client');
const { loadVotacoes } = require('../../src/utils/file-handler');
const { validateDashboardToken } = require('./auth');

const router = express.Router();

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function computeTotalVotes(options) {
  return safeArray(options).reduce((sum, option) => sum + (Number(option?.votes || option?.pontos || 0) || 0), 0);
}

function resolveGuildAndChannel({ guildId = null, channelId = null } = {}) {
  const guilds = Array.from(client.guilds?.cache?.values() || []);

  if (guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const channel = channelId ? guild.channels?.cache?.get(channelId) : null;
      return {
        serverId: guild.id,
        serverName: guild.name || 'Servidor desconhecido',
        channelId: channel?.id || channelId || null,
        channelName: channel?.name || null,
      };
    }
  }

  if (channelId) {
    for (const guild of guilds) {
      const channel = guild.channels?.cache?.get(channelId);
      if (channel) {
        return {
          serverId: guild.id,
          serverName: guild.name || 'Servidor desconhecido',
          channelId: channel.id,
          channelName: channel.name || null,
        };
      }
    }
  }

  return {
    serverId: guildId || null,
    serverName: guildId ? `Servidor ${guildId}` : 'Servidor desconhecido',
    channelId,
    channelName: channelId ? `Canal ${channelId}` : null,
  };
}

function normalizeOption(option, index = 0) {
  if (!option) return null;

  return {
    id: option.id || option.opcao || `option-${index}`,
    text: option.text || option.opcao || option.name || '',
    votes: Number(option.votes ?? option.pontos ?? 0) || 0,
    emoji: option.emoji || null,
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

  const optionVotes = safeArray(poll?.opcoes).map((option, index) => {
    const emoji = emojiList[index] || null;
    const votesForOption = Object.values(votes).reduce((sum, voteEntry) => {
      const reactions = safeArray(voteEntry?.reacoes);
      return reactions.includes(emoji) ? sum + (Number(voteEntry?.peso || 1) || 1) : sum;
    }, 0);

    return {
      id: option?.id || `active-${index}`,
      text: option || '',
      votes: votesForOption,
      emoji,
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
    status: 'active',
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
