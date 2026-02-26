const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../utils/permissions');
const fs = require('fs');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Adicionar Mensalista').setType(ApplicationCommandType.User).setDefaultMemberPermissions(0),

  async execute(interaction, client) {
    const mensalistasFilePath = './mensalistas.json';
    const usuario = interaction.targetUser;

    try {
      // =====================================
      // VERIFICAÇÃO DE PERMISSÕES - SISTEMA BINÁRIO
      // Apenas usuários com o cargo Criador podem executar este comando
      // =====================================
      if (!isCriador(interaction.member)) {
        return await interaction.reply({
          content: MENSAGEM_PERMISSAO_NEGADA,
          flags: MessageFlags.Ephemeral,
        });
      }

      let mensalistasData = { mensalistas: [] };
      if (fs.existsSync(mensalistasFilePath)) {
        mensalistasData = JSON.parse(fs.readFileSync(mensalistasFilePath, 'utf8'));
      }

      if (mensalistasData.mensalistas.includes(usuario.id)) {
        return await interaction.reply({
          content: `${usuario.username} ja esta na lista de mensalistas.`,
          flags: MessageFlags.Ephemeral,
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

      await interaction.reply({ embeds: [addEmbed], flags: MessageFlags.Ephemeral });
      console.log(`✅ Mensalista adicionado (contexto): ${usuario.username} (${usuario.id})`);
    } catch (error) {
      console.error('❌ Erro ao adicionar mensalista (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
