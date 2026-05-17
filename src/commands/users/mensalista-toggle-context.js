const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { isCriador } = require('../../utils/permissions');
const { loadMensalistas, saveMensalistas } = require('../../utils/file-handler');
const { buildMensalistaToggleEmbed, replyPermissionDenied, replyEphemeral } = require('../../utils/response-builders');
const { handleCommandError } = require('../../utils/error-handler');
const logger = require('../../utils/logger');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Add/Del Mensalistas').setType(ApplicationCommandType.User),

  async execute(interaction, _client) {
    const usuario = interaction.targetUser;

    try {
      if (!isCriador(interaction.member, interaction.guildId)) {
        return await replyPermissionDenied(interaction);
      }

      let mensalistasData = loadMensalistas();
      const isMensalista = mensalistasData.mensalistas.some((entry) => entry.id === usuario.id);

      if (isMensalista) {
        mensalistasData.mensalistas = mensalistasData.mensalistas.filter((entry) => entry.id !== usuario.id);
        saveMensalistas(mensalistasData);

        const removeEmbed = buildMensalistaToggleEmbed({ username: usuario.username, added: false, viaContext: true });
        await replyEphemeral(interaction, { embeds: [removeEmbed] });
        logger.info(`Mensalista removido (contexto): ${usuario.username} (${usuario.id})`);
      } else {
        mensalistasData.mensalistas.push({
          id: usuario.id,
          addedAt: new Date().toISOString(),
          addedBy: interaction.user.id,
        });
        saveMensalistas(mensalistasData);

        const addEmbed = buildMensalistaToggleEmbed({ username: usuario.username, added: true, viaContext: true });
        await replyEphemeral(interaction, { embeds: [addEmbed] });
        logger.info(`Mensalista adicionado (contexto): ${usuario.username} (${usuario.id})`);
      }
    } catch (error) {
      await handleCommandError(interaction, error, 'mensalista-toggle-context', 'Erro ao processar o comando.');
    }
  },
};
