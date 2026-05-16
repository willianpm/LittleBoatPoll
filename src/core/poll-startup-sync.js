const { client } = require('./client');
const logger = require('../utils/logger');
const { saveActivePolls } = require('./poll-persistence');
const { getMensalistasSet, isUserMensalista } = require('./mensalista-runtime');
const { getReactionEmojiKey, normalizePollMaxVotos } = require('./reaction-handler');

async function syncPollReactions() {
  const totalEnquetes = client.activePolls.size;

  const mensalistasSet = getMensalistasSet();
  const enquetesOrfas = [];
  let enquetesProcessadas = 0;
  const startTime = Date.now();

  for (const [messageId, poll] of client.activePolls.entries()) {
    try {
      enquetesProcessadas++;

      if (!poll.channelId) {
        logger.info(`[${enquetesProcessadas}/${totalEnquetes}] "${poll.titulo}" sem channelId - pulando`);
        continue;
      }

      logger.info(`Sincronizando "${poll.titulo}"... [${enquetesProcessadas}/${totalEnquetes}]`);

      const channel = await client.channels.fetch(poll.channelId).catch((err) => {
        logger.error(`Erro ao buscar canal: ${err.message}`);
        return null;
      });
      if (!channel) {
        logger.warn('Canal não encontrado - marcando para remoção');
        enquetesOrfas.push(messageId);
        continue;
      }

      const guild = channel.guild;

      const botMember = channel.guild?.members.me;
      if (botMember) {
        const permissions = channel.permissionsFor(botMember);
        const canRead = permissions?.has('ReadMessageHistory');

        if (!canRead) {
          logger.warn(`Falta permissão "Ler Histórico" em ${channel.name}`);
        }
      }

      const message = await channel.messages.fetch(messageId).catch((err) => {
        logger.error(`Mensagem não encontrada: ${err.message}`);
        return null;
      });
      if (!message) {
        enquetesOrfas.push(messageId);
        continue;
      }

      const reactionFetches = [];
      for (const reaction of message.reactions.cache.values()) {
        if (reaction.partial) {
          reactionFetches.push(reaction.fetch().catch(() => null));
        }
      }
      await Promise.all(reactionFetches);

      const userFetches = [];
      const reactionUsersMap = new Map();

      for (const reaction of message.reactions.cache.values()) {
        const fetchPromise = reaction.users
          .fetch()
          .then((users) => {
            const emojiKey = getReactionEmojiKey(reaction);
            if (emojiKey) {
              reactionUsersMap.set(emojiKey, users);
            }
            return users;
          })
          .catch(() => null);
        userFetches.push(fetchPromise);
      }
      await Promise.all(userFetches);

      const votosAtualizados = {};

      for (const reaction of message.reactions.cache.values()) {
        const emoji = getReactionEmojiKey(reaction);
        if (!emoji) continue;

        if (!poll.emojiNumeros.includes(emoji)) continue;

        const users = reactionUsersMap.get(emoji);
        if (!users) continue;

        for (const user of users.values()) {
          if (user.bot) continue;

          if (!votosAtualizados[user.id]) {
            const isMensalista = await isUserMensalista(guild, user.id, mensalistasSet);
            const peso = isMensalista && poll.usarPesoMensalista ? 2 : 1;

            votosAtualizados[user.id] = {
              usuario: user.username,
              peso: peso,
              reacoes: [],
              timestamp: poll.votos[user.id]?.timestamp || new Date(),
            };
          }

          if (!votosAtualizados[user.id].reacoes.includes(emoji)) {
            votosAtualizados[user.id].reacoes.push(emoji);
          }
        }
      }

      poll.votos = votosAtualizados;

      const totalVotos = Object.keys(votosAtualizados).length;
      logger.info(`${totalVotos} voto(s) sincronizado(s)`);
    } catch (error) {
      logger.error(`Erro ao sincronizar enquete "${poll.titulo}": ${error.message}`);
    }
  }

  if (enquetesOrfas.length > 0) {
    logger.info(`Removendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  saveActivePolls();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const enquetesAtivas = client.activePolls.size;

  if (enquetesAtivas > 0) {
    logger.info(`${enquetesAtivas} enquete(s) sincronizada(s) em ${elapsed}s`);
  } else {
    logger.info(`Sincronização concluída em ${elapsed}s (nenhuma enquete ativa)`);
  }
}

async function enforceVoteLimits() {
  const enquetesOrfas = [];

  for (const [messageId, poll] of client.activePolls.entries()) {
    try {
      if (!poll.channelId) continue;

      const channel = await client.channels.fetch(poll.channelId).catch((err) => {
        logger.error(`Erro ao buscar canal ${poll.channelId}: ${err.message}`);
        return null;
      });
      if (!channel) {
        enquetesOrfas.push(messageId);
        continue;
      }

      const botMember = channel.guild?.members.me;
      if (botMember) {
        const permissions = channel.permissionsFor(botMember);
        const canView = permissions?.has('ViewChannel');
        const canRead = permissions?.has('ReadMessageHistory');
        const canManage = permissions?.has('ManageMessages');

        if (!canView || !canRead || !canManage) {
          logger.warn(
            `Enquete "${poll.titulo}" no canal "${channel.name}" - Permissões: ` +
              `Ver Canal: ${canView ? 'Sim' : 'NÃO'} | ` +
              `Ler Histórico: ${canRead ? 'Sim' : 'NÃO'} | ` +
              `Gerenciar Mensagens: ${canManage ? 'Sim' : 'NÃO'}`,
          );
        }
      }

      const message = await channel.messages.fetch(messageId).catch((err) => {
        logger.error(`Erro ao buscar mensagem ${messageId} no canal ${channel.name}: ${err.message} (${err.code})`);
        return null;
      });
      if (!message) {
        enquetesOrfas.push(messageId);
        continue;
      }

      for (const reaction of message.reactions.cache.values()) {
        if (reaction.partial) {
          await reaction.fetch().catch(() => null);
        }
        await reaction.users.fetch().catch(() => null);
      }

      normalizePollMaxVotos(poll);

      let violacoesSencontradas = 0;

      for (const [userId, userVotes] of Object.entries(poll.votos)) {
        const numVotos = userVotes.reacoes.length;

        if (numVotos > poll.maxVotos) {
          logger.warn(`"${poll.titulo}" - ${userVotes.usuario}: ${numVotos} votos (limite: ${poll.maxVotos})`);

          const votosParaRemover = numVotos - poll.maxVotos;
          const reacoesParaRemover = userVotes.reacoes.slice(-votosParaRemover);

          try {
            const removidasComSucesso = [];
            for (const emoji of reacoesParaRemover) {
              const reaction = message.reactions.cache.find((r) => getReactionEmojiKey(r) === emoji);
              if (reaction) {
                try {
                  await reaction.users.remove(userId);
                  removidasComSucesso.push(emoji);
                } catch (err) {
                  if (err && err.code === 50013) {
                    logger.error(
                      `Sem permissão para remover reação de ${userVotes.usuario}. O bot precisa de "Gerenciar Mensagens"`,
                    );
                  } else {
                    logger.error(`Erro ao remover reação: ${err && err.message}`);
                  }
                }
              }
            }

            if (removidasComSucesso.length > 0) {
              userVotes.reacoes = userVotes.reacoes.filter((emoji) => !removidasComSucesso.includes(emoji));
            }
            if (userVotes.reacoes.length > poll.maxVotos) {
              userVotes.reacoes = userVotes.reacoes.slice(0, poll.maxVotos);
            }

            try {
              const user = await client.users.fetch(userId).catch(() => null);
              if (user) {
                await user
                  .send(
                    `⚠️ **Votos ajustados em "${poll.titulo}"**\n\n` +
                      `Você havia votado em ${numVotos} opção(ões), mas o limite é ${poll.maxVotos}.\n` +
                      `As ${votosParaRemover} opção(ões) mais recente(s) foram removidas.\n` +
                      `Seus votos atuais: ${userVotes.reacoes.join(', ')}`,
                  )
                  .catch(() => {});
              }
            } catch (e) {
              // Silencioso se não conseguir enviar DM
            }

            violacoesSencontradas++;
            logger.info(`Removidos ${votosParaRemover} voto(s) em excesso de ${userVotes.usuario}`);
          } catch (error) {
            logger.error(`Erro ao remover votos de ${userVotes.usuario}: ${error.message}`);
          }
        }
      }

      if (violacoesSencontradas > 0) {
        logger.info(`"${poll.titulo}": ${violacoesSencontradas} usuário(s) tiveram votos ajustados`);
      }
    } catch (error) {
      logger.error(`Erro ao verificar limites de "${poll.titulo}": ${error.message}`);
    }
  }

  if (enquetesOrfas.length > 0) {
    logger.info(`Removendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  saveActivePolls();
  if (client.activePolls.size > 0) {
    logger.info('Verificação de limites concluída');
  }
}

module.exports = {
  syncPollReactions,
  enforceVoteLimits,
};
