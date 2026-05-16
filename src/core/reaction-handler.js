const config = require('../utils/config');
const logger = require('../utils/logger');
const { saveActivePolls } = require('./poll-persistence');
const { isUserMensalista } = require('./mensalista-runtime');

const DEBUG_MODE = config.DEBUG_MODE;

function normalizePollMaxVotos(poll) {
  const maxVotos = Number(poll.maxVotos);
  const maxVotosValido = Number.isFinite(maxVotos) && maxVotos > 0 ? maxVotos : 1;
  const changed = poll.maxVotos !== maxVotosValido;

  if (changed) {
    poll.maxVotos = maxVotosValido;
  }

  return { maxVotosValido, changed };
}

async function hydrateReactionPayload(reaction) {
  if (reaction.partial) {
    await reaction.fetch().catch(() => null);
  }
  if (reaction.message && reaction.message.partial) {
    await reaction.message.fetch().catch(() => null);
  }
}

function getReactionEmojiKey(reaction) {
  const emoji = reaction?.emoji;
  if (!emoji) return null;

  if (emoji.id && emoji.name) {
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
  }

  return emoji.name || null;
}

function registerReactionHandlers(client) {
  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;

      await hydrateReactionPayload(reaction);

      const poll = client.activePolls.get(reaction.message.id);
      if (!poll) return;
      if (poll.status !== 'ativa' || poll._closing) return;

      const emoji = getReactionEmojiKey(reaction);
      if (!emoji) return;

      if (!poll.emojiNumeros.includes(emoji)) {
        await reaction.users.remove(user.id).catch(() => null);
        return;
      }

      const isMensalista = await isUserMensalista(reaction.message.guild, user.id);
      const peso = isMensalista && poll.usarPesoMensalista ? 2 : 1;

      if (!poll.votos[user.id]) {
        poll.votos[user.id] = {
          usuario: user.username,
          peso: peso,
          reacoes: [],
          timestamp: new Date(),
        };
      }

      poll.votos[user.id].peso = peso;

      if (poll.votos[user.id].reacoes.includes(emoji)) {
        return;
      }

      const { maxVotosValido, changed } = normalizePollMaxVotos(poll);
      if (changed) {
        saveActivePolls();
      }

      if (poll.votos[user.id].reacoes.length >= maxVotosValido) {
        await reaction.users.remove(user.id).catch(() => null);
        try {
          await user.send(`Você já atingiu o limite de ${maxVotosValido} voto(s) nesta enquete: "${poll.titulo}"`);
        } catch (e) {
          // DM bloqueada ou desativada
        }
        return;
      }

      poll.votos[user.id].reacoes.push(emoji);
      saveActivePolls();
    } catch (error) {
      logger.error(`Erro ao processar reação: ${error && (error.stack || error.message)}`);
    }
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    try {
      if (user.bot) return;

      await hydrateReactionPayload(reaction);

      const poll = client.activePolls.get(reaction.message.id);
      if (!poll) return;
      if (poll.status !== 'ativa' || poll._closing) return;

      const emoji = getReactionEmojiKey(reaction);
      if (!emoji) return;

      if (poll.votos[user.id] && poll.votos[user.id].reacoes) {
        const index = poll.votos[user.id].reacoes.indexOf(emoji);
        if (index > -1) {
          poll.votos[user.id].reacoes.splice(index, 1);

          if (poll.votos[user.id].reacoes.length === 0) {
            delete poll.votos[user.id];
          }
        }
      }

      saveActivePolls();
    } catch (error) {
      logger.error(`Erro ao remover reação: ${error && (error.stack || error.message)}`);
    }
  });
}

module.exports = {
  registerReactionHandlers,
  normalizePollMaxVotos,
  hydrateReactionPayload,
  getReactionEmojiKey,
};
