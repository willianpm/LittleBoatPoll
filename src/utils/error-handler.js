const { MessageFlags } = require('discord.js');
const logger = require('./logger');

/**
 * Responde com mensagem de erro, tratando os diferentes estados da interação
 * @param {Interaction} interaction - Interação do Discord
 * @param {string} message - Mensagem de erro a enviar
 * @returns {Promise}
 */

async function replyError(interaction, message = '❌ Erro ao processar o comando!') {
  // Try reply/editReply/followUp in sequence so a failure in one doesn't prevent fallbacks
  if (!interaction.replied && !interaction.deferred) {
    try {
      return await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
    } catch (err) {
      logger.error(`reply falhou: ${err && (err.stack || err.message)}`);
      try {
        return await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral });
      } catch (err2) {
        logger.error(`followUp (fallback) falhou: ${err2 && (err2.stack || err2.message)}`);
        return null;
      }
    }
  }

  if (interaction.deferred && !interaction.replied) {
    try {
      return await interaction.editReply({ content: message });
    } catch (err) {
      logger.error(`editReply falhou: ${err && (err.stack || err.message)}`);
      try {
        return await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral });
      } catch (err2) {
        logger.error(`followUp (fallback) falhou: ${err2 && (err2.stack || err2.message)}`);
        return null;
      }
    }
  }

  // interaction.replied === true
  try {
    return await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral });
  } catch (err) {
    logger.error(`followUp falhou: ${err && (err.stack || err.message)}`);
    return null;
  }
}

/**
 * Log de erro com contexto
 * @param {string} context - Contexto da operação (ex: "criador-toggle")
 * @param {Error} error - Erro original
 * @param {string} details - Detalhes adicionais (opcional)
 */
function logError(context, error, details = '') {
  const message = `[${context}] ${error.message}`;
  const log = details ? `${message} | ${details}` : message;
  logger.error(log);
}

/**
 * Loga o erro e responde à interação com mensagem padrão
 * @param {Interaction} interaction
 * @param {Error} error
 * @param {string} context
 * @param {string} [message]
 */
async function handleCommandError(interaction, error, context, message = '❌ Erro ao processar o comando!') {
  logError(context, error);
  await replyError(interaction, message);
}

module.exports = {
  replyError,
  logError,
  handleCommandError,
};
