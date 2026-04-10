const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { closePollByMessageId } = require('../../core/poll-close-service');
const logger = require('../../utils/logger');

/**
 * COMANDO DE CONTEXTO: Encerrar Votação
 * Aparece ao clicar com botão direito em uma mensagem
 * Encerra a votação se for uma enquete ativa
 */
module.exports = {
  data: new ContextMenuCommandBuilder().setName('Encerrar Votação').setType(ApplicationCommandType.Message),

  async execute(interaction, client) {
    const message = interaction.targetMessage;
    const messageId = message.id;

    try {
      // =====================================
      // VERIFICAÇÃO DE PERMISSÕES - SISTEMA BINÁRIO
      // Apenas usuários com o cargo Criador podem executar este comando
      // =====================================
      if (!isCriador(interaction.member, interaction.guildId)) {
        return await interaction.reply({
          content: MENSAGEM_PERMISSAO_NEGADA,
          flags: MessageFlags.Ephemeral,
        });
      }

      const poll = client.activePolls.get(messageId);
      if (!poll) {
        return await interaction.reply({
          content: '❌ Esta mensagem não é uma enquete ativa! Certifique-se de clicar na mensagem correta da enquete.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const closeResult = await closePollByMessageId({
        client,
        messageId,
        interaction,
        reason: 'manual',
      });

      if (!closeResult.success && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Não foi possível encerrar esta votação agora. Tente novamente.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      logger.error(`Erro ao encerrar votação: ${error.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao encerrar a votação!',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
