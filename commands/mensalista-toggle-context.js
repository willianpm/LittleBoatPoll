const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../utils/permissions');
const fs = require('fs');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Add/Del Mensalistas').setType(ApplicationCommandType.User).setDefaultMemberPermissions(0),

  async execute(interaction, client) {
    const mensalistasFilePath = './mensalistas.json';
    const usuario = interaction.targetUser;

    try {
      // =====================================
      // VERIFICAÇÃO DE PERMISSÕES
      // Apenas usuários com o cargo Criador de Enquetes podem executar este comando
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

      // Verifica se o usuário já é mensalista
      const isMensalista = mensalistasData.mensalistas.includes(usuario.id);

      if (isMensalista) {
        // Remove mensalista
        mensalistasData.mensalistas = mensalistasData.mensalistas.filter((id) => id !== usuario.id);
        fs.writeFileSync(mensalistasFilePath, JSON.stringify(mensalistasData, null, 2));

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
        console.log(`❌ Mensalista removido (contexto): ${usuario.username} (${usuario.id})`);
      } else {
        // Adiciona mensalista
        mensalistasData.mensalistas.push(usuario.id);
        fs.writeFileSync(mensalistasFilePath, JSON.stringify(mensalistasData, null, 2));

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
        console.log(`✅ Mensalista adicionado (contexto): ${usuario.username} (${usuario.id})`);
      }
    } catch (error) {
      console.error('❌ Erro ao alternar mensalista (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
