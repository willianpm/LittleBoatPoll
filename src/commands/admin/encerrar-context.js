const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { isCriador } = require('../../utils/permissions');
const { closePollByMessageId } = require('../../core/poll-close-service');
const { replyPermissionDenied, replyEphemeral } = require('../../utils/response-builders');
const { handleCommandError } = require('../../utils/error-handler');

/**
 * COMANDO DE CONTEXTO: Encerrar Votação
 */
module.exports = {
  data: new ContextMenuCommandBuilder().setName('Encerrar Votação').setType(ApplicationCommandType.Message),

  async execute(interaction, client) {
    const messageId = interaction.targetMessage.id;

    try {
      if (!isCriador(interaction.member, interaction.guildId)) {
        return await replyPermissionDenied(interaction);
      }

      const poll = client.activePolls.get(messageId);
      if (!poll) {
        return await replyEphemeral(interaction, {
          content: '❌ Esta mensagem não é uma enquete ativa! Certifique-se de clicar na mensagem correta da enquete.',
        });
      }

      const closeResult = await closePollByMessageId({
        client,
        messageId,
        interaction,
        reason: 'manual',
      });

      if (!closeResult.success && !interaction.replied && !interaction.deferred) {
        await replyEphemeral(interaction, {
          content: '❌ Não foi possível encerrar esta votação agora. Tente novamente.',
        });
      }
    } catch (error) {
      await handleCommandError(interaction, error, 'encerrar-context', '❌ Erro ao encerrar a votação!');
    }
  },
};
