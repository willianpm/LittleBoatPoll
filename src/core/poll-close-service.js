const { EmbedBuilder } = require('discord.js');
const { loadVotacoes, saveVotacoes } = require('../utils/file-handler');
const logger = require('../utils/logger');
const { draftOptionText, normalizeDraftOptions } = require('../utils/draft-option-normalizer');

async function buildMensalistasList(client, poll) {
  let mensalistasList = '(nenhum)';

  try {
    const mensalistasQueVotaram = [];

    for (const [userId, votoData] of Object.entries(poll.votos || {})) {
      if (Number(votoData?.peso) === 2) {
        mensalistasQueVotaram.push(userId);
      }
    }

    if (mensalistasQueVotaram.length > 0) {
      const mencoes = [];

      for (const userId of mensalistasQueVotaram) {
        try {
          await client.users.fetch(userId);
          mencoes.push(`<@${userId}>`);
        } catch (error) {
          logger.warn(`Não foi possível buscar usuário ${userId}`);
        }
      }

      if (mencoes.length > 0) {
        mensalistasList = mencoes.join(' ');
      }
    }
  } catch (error) {
    logger.error(`Erro ao buscar mensalistas: ${error.message}`);
  }

  return mensalistasList;
}

function computePollResults(poll) {
  const resultados = (poll.opcoes || []).map((opcao, index) => ({
    opcao: draftOptionText(opcao),
    emoji: poll.emojiNumeros[index],
    pontos: 0,
    votantes: [],
  }));

  for (const [userId, votoData] of Object.entries(poll.votos || {})) {
    const peso = Number.isFinite(Number(votoData?.peso)) ? Number(votoData.peso) : 1;

    for (const emoji of votoData.reacoes || []) {
      const index = poll.emojiNumeros.indexOf(emoji);
      if (index !== -1) {
        resultados[index].pontos += peso;
        resultados[index].votantes.push(userId);
      }
    }
  }

  resultados.sort((a, b) => b.pontos - a.pontos);
  const vencedor = resultados[0] || { opcao: 'Sem votos', pontos: 0 };
  const empate = resultados.filter((r) => r.pontos === vencedor.pontos).length > 1;

  return {
    resultados,
    vencedor,
    empate,
  };
}

async function notifyPollClosed({ interaction, client, poll, resultEmbed }) {
  if (interaction) {
    await interaction.reply({ embeds: [resultEmbed] });
    return;
  }

  const channel = poll.channelId ? await client.channels.fetch(poll.channelId).catch(() => null) : null;
  if (channel && typeof channel.send === 'function') {
    await channel.send({ embeds: [resultEmbed] }).catch((error) => {
      logger.error(`Erro ao enviar resultado automático da votação: ${error.message}`);
    });
  }
}

function buildResultEmbed(poll, resultados, empate, mensalistasList, reason) {
  const cor = empate ? '#FFFF00' : '#00FF00';
  const tituloResultado = empate ? 'RESULTADO: EMPATE! 🤝' : 'VENCEDOR! 🏆';

  const resultEmbed = new EmbedBuilder()
    .setColor(cor)
    .setTitle('📊 RESULTADO FINAL DA VOTAÇÃO 📊')
    .setDescription(`${poll.titulo}\n\n${tituloResultado}`);

  const top3 = resultados.slice(0, 3);
  top3.forEach((resultado, index) => {
    const posicao = index === 0 && !empate ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
    resultEmbed.addFields({
      name: `${posicao} __**${resultado.opcao}**__`,
      value: `**${resultado.pontos} pontos** • ${resultado.votantes.length} votante(s)`,
      inline: false,
    });
  });

  if (poll.usarPesoMensalista) {
    resultEmbed.addFields({
      name: '👑 Mensalistas que votaram:',
      value: `${mensalistasList}`,
      inline: false,
    });
  }

  const informacoesPeso = poll.usarPesoMensalista ? 'Mensalistas contam como peso 2' : 'Peso igual para todos';
  const infoResumo =
    `Total de participantes: ${Object.keys(poll.votos || {}).length}\n` +
    `Limite de votos: ${poll.maxVotos} por pessoa\n` +
    `${informacoesPeso}\n\n` +
    '*Mostrando apenas o TOP 3*';

  const reasonLabel = reason === 'expired' ? 'expirada automaticamente' : 'finalizada';

  resultEmbed
    .addFields(
      { name: '\u200B', value: '\u200B', inline: false },
      {
        name: 'ℹ️ Informações',
        value: infoResumo,
        inline: false,
      },
    )
    .setFooter({ text: `Votação ${reasonLabel}` })
    .setTimestamp();

  return resultEmbed;
}

async function closePollByMessageId({ client, messageId, interaction = null, reason = 'manual' }) {
  const poll = client.activePolls.get(messageId);
  let removedFromActive = false;

  if (!poll) {
    return {
      success: false,
      code: 'POLL_NOT_FOUND',
      message: 'Enquete não encontrada ou já encerrada.',
    };
  }

  if (poll._closing) {
    return {
      success: false,
      code: 'POLL_CLOSING',
      message: 'Encerramento já em andamento para esta enquete.',
    };
  }

  poll._closing = true;

  try {
    poll.status = 'finalizada';
    poll.finalizadaEm = new Date();

    const { resultados, vencedor, empate } = computePollResults(poll);

    client.activePolls.delete(messageId);
    removedFromActive = true;
    client.saveActivePolls();

    const historicoData = loadVotacoes();
    const normalizedOptions = normalizeDraftOptions(poll.opcoes);
    historicoData.push({
      id: messageId,
      titulo: poll.titulo,
      description:
        `Selecione até ${poll.maxVotos} opç${poll.maxVotos > 1 ? 'ões' : 'ão'}:\n\n` +
        normalizedOptions
          .map((opcao, index) => `**${poll.emojiNumeros[index]} ${draftOptionText(opcao)}**`)
          .join('\n\n'),
      guildId: poll.guildId || interaction?.guildId || null,
      guildName: interaction?.guild?.name || poll.guildName || null,
      channelId: poll.channelId || interaction?.channelId || null,
      channelName: interaction?.channel?.name || poll.channelName || null,
      opcoes: normalizedOptions,
      maxVotos: poll.maxVotos,
      usarPesoMensalista: poll.usarPesoMensalista,
      allowMultipleChoices: poll.maxVotos > 1,
      anonymous: Boolean(poll.anonymous),
      resultados,
      vencedor: empate ? 'Empate' : vencedor.opcao,
      participantes: Object.keys(poll.votos || {}).length,
      totalVotes: resultados.reduce((sum, resultado) => sum + (resultado.pontos || 0), 0),
      dataCriacao: poll.criadoEm,
      dataFinalizacao: poll.finalizadaEm,
      endsAt: poll.endsAt || null,
      durationKey: poll.durationKey || null,
      closeReason: reason,
      status: 'ended',
    });

    if (saveVotacoes(historicoData) === false) {
      throw new Error('falha ao salvar historico');
    }

    const mensalistasList = await buildMensalistasList(client, poll);
    const resultEmbed = buildResultEmbed(poll, resultados, empate, mensalistasList, reason);
    try {
      await notifyPollClosed({ interaction, client, poll, resultEmbed });
    } catch (notifyError) {
      logger.error(`Erro ao notificar encerramento da votação ${messageId}: ${notifyError.message}`);
    }

    logger.info(`Votação finalizada (${reason}): ${poll.titulo} | Vencedor: ${empate ? 'Empate' : vencedor.opcao}`);

    return {
      success: true,
      pollTitle: poll.titulo,
      winner: empate ? 'Empate' : vencedor.opcao,
      tie: empate,
      reason,
    };
  } catch (error) {
    logger.error(`Erro ao encerrar votação: ${error.message}`);

    poll.status = 'ativa';
    delete poll.finalizadaEm;

    if (removedFromActive) {
      client.activePolls.set(messageId, poll);
      try {
        client.saveActivePolls();
      } catch (saveError) {
        logger.error(`Erro ao reverter estado da enquete ${messageId}: ${saveError.message}`);
      }
    }

    return {
      success: false,
      code: 'POLL_CLOSE_FAILED',
      message: error.message,
    };
  } finally {
    if (poll) {
      delete poll._closing;
    }
  }
}

module.exports = {
  closePollByMessageId,
  computePollResults,
};
