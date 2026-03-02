const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { loadMensalistas, saveMensalistas } = require('../../utils/file-handler');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Add/Del Mensalistas').setType(ApplicationCommandType.User),

  async execute(interaction, client) {
    const usuario = interaction.targetUser;

    try {
      // Verifica permissões
      if (!isCriador(interaction.member, interaction.guildId)) {
        return await interaction.reply({
          content: MENSAGEM_PERMISSAO_NEGADA,
          flags: MessageFlags.Ephemeral,
        });
      }

      let mensalistasData = loadMensalistas();

      // Verifica se o usuário já é mensalista
      const isMensalista = mensalistasData.mensalistas.includes(usuario.id);

      if (isMensalista) {
        // Remove mensalista
        mensalistasData.mensalistas = mensalistasData.mensalistas.filter((id) => id !== usuario.id);
        saveMensalistas(mensalistasData);

        const removeEmbed = new EmbedBuilder()
          .setColor('#FF6600')
          .setTitle('MENSALISTA REMOVIDO')
          .setDescription(`${usuario.username} foi removido da lista de mensalistas.`)
          .addFields({
            name: 'Mudança',
            value: 'Votos com peso 1 para este usuário.',
            inline: false,
          })
          .setTimestamp();

        await interaction.reply({ embeds: [removeEmbed], flags: MessageFlags.Ephemeral });
        console.log(`Mensalista removido (contexto): ${usuario.username} (${usuario.id})`);
      } else {
        // Adiciona mensalista
        mensalistasData.mensalistas.push(usuario.id);
        saveMensalistas(mensalistasData);

        const addEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('MENSALISTA ADICIONADO')
          .setDescription(`${usuario.username} foi adicionado a lista de mensalistas.`)
          .addFields({
            name: 'Benefício',
            value: 'Votos com peso 2 para este usuário.',
            inline: false,
          })
          .setTimestamp();

        await interaction.reply({ embeds: [addEmbed], flags: MessageFlags.Ephemeral });
        console.log(`Mensalista adicionado (contexto): ${usuario.username} (${usuario.id})`);
      }
    } catch (error) {
      console.error('Erro ao alternar mensalista (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
