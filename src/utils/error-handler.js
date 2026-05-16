const { MessageFlags } = require('discord.js');
const logger = require('./logger');

/**
 * Responde com mensagem de erro, tratando os diferentes estados da interação
 * @param {Interaction} interaction - Interação do Discord
 * @param {string} message - Mensagem de erro a enviar
 * @returns {Promise}
 */

async function replyError(interaction, message = '❌ Erro ao processar o comando!') {
  try {
    if (!interaction.replied && !interaction.deferred) {
      return await interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    } else if (interaction.deferred && !interaction.replied) {
      return await interaction.editReply({ content: message });
      } else {
        return await interaction.followUp({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
    }
  } catch (error) {
      logger.error(`Erro ao enviar resposta de erro: ${error && (error.stack || error.message)}`);
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
