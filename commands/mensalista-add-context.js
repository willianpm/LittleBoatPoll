const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Adicionar Mensalista').setType(ApplicationCommandType.User).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
          ephemeral: true,
        });
      }

      let mensalistasData = { mensalistas: [] };
      if (fs.existsSync(mensalistasFilePath)) {
        mensalistasData = JSON.parse(fs.readFileSync(mensalistasFilePath, 'utf8'));
      }

      if (mensalistasData.mensalistas.includes(usuario.id)) {
        return await interaction.reply({
          content: `${usuario.username} ja esta na lista de mensalistas.`,
          ephemeral: true,
        });
      }

      mensalistasData.mensalistas.push(usuario.id);
      fs.writeFileSync(mensalistasFilePath, JSON.stringify(mensalistasData, null, 2));

      const addEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('MENSALISTA ADICIONADO')
        .setDescription(`${usuario.username} foi adicionado a lista de mensalistas.`)
        .addFields({
          name: 'Beneficio',
          value: 'Votos com peso 2 para este usuario.',
          inline: false,
        })
        .setTimestamp();

      await interaction.reply({ embeds: [addEmbed] });
      console.log(`✅ Mensalista adicionado (contexto): ${usuario.username} (${usuario.id})`);
    } catch (error) {
      console.error('❌ Erro ao adicionar mensalista (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Erro ao processar o comando.',
          ephemeral: true,
        });
      }
    }
  },
};
