const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Remover Mensalista').setType(ApplicationCommandType.User).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const mensalistasFilePath = './mensalistas.json';
    const usuario = interaction.targetUser;

    try {
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      let cargosPermitidos = [];
      if (fs.existsSync('./cargos-criadores.json')) {
        const data = JSON.parse(fs.readFileSync('./cargos-criadores.json', 'utf8'));
        cargosPermitidos = data.cargos || [];
      }

      const temCargoPermitido = interaction.member.roles.cache.some((role) => cargosPermitidos.includes(role.id));

      if (!isAdmin && !temCargoPermitido) {
        return await interaction.reply({
          content: 'Permissao negada. Apenas administradores ou membros autorizados podem gerenciar mensalistas.',
          flags: MessageFlags.Ephemeral,
        });
      }

      let mensalistasData = { mensalistas: [] };
      if (fs.existsSync(mensalistasFilePath)) {
        mensalistasData = JSON.parse(fs.readFileSync(mensalistasFilePath, 'utf8'));
      }

      const index = mensalistasData.mensalistas.indexOf(usuario.id);
      if (index === -1) {
        return await interaction.reply({
          content: `${usuario.username} nao esta na lista de mensalistas.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      mensalistasData.mensalistas.splice(index, 1);
      fs.writeFileSync(mensalistasFilePath, JSON.stringify(mensalistasData, null, 2));

      const removeEmbed = new EmbedBuilder()
        .setColor('#FF6600')
        .setTitle('MENSALISTA REMOVIDO')
        .setDescription(`${usuario.username} foi removido da lista de mensalistas.`)
        .addFields({
          name: 'Mudanca',
          value: 'Votos com peso 1 para este usuario.',
          inline: false,
        })
        .setTimestamp();

      await interaction.reply({ embeds: [removeEmbed], flags: MessageFlags.Ephemeral });
      console.log(`❌ Mensalista removido (contexto): ${usuario.username} (${usuario.id})`);
    } catch (error) {
      console.error('❌ Erro ao remover mensalista (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
