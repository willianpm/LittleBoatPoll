const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

/**
 * COMANDO: /iniciar
 * Abre/Inicia o período de votação
 *
 * Este comando marca uma enquete como ativa e começa a contar votos
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('iniciar')
    .setDescription('Inicia o período de votação da enquete')
    .addStringOption((option) => option.setName('mensagem_id').setDescription('ID da mensagem da enquete (copiar ID da mensagem)').setRequired(true)),

  async execute(interaction, client) {
    const messageId = interaction.options.getString('mensagem_id');

    try {
      // Verifica se a enquete existe
      const poll = client.activePolls.get(messageId);

      if (!poll) {
        return await interaction.reply({
          content: '❌ Enquete não encontrada! Certifique-se de que o ID está correto.',
          ephemeral: true,
        });
      }

      // Atualiza o status da enquete
      poll.status = 'ativa';
      poll.iniciadaEm = new Date();

      // Cria um embed de confirmação
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00FF00') // Verde
        .setTitle('✅ VOTAÇÃO INICIADA')
        .setDescription(`A votação para **${poll.titulo}** começou!`)
        .addFields({ name: '📊 Opções', value: poll.opcoes.join(', '), inline: false }, { name: '🗳️ Limite de votos', value: `${poll.maxVotos} por pessoa`, inline: true }, { name: 'Status', value: '🟢 VOTAÇÃO ATIVA', inline: true })
        .setFooter({ text: 'Vote com as reações numéricas disponíveis!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
      });

      console.log(`🟢 Votação iniciada: ${messageId}`);
    } catch (error) {
      console.error('❌ Erro ao iniciar votação:', error);
      await interaction.reply({
        content: '❌ Erro ao iniciar a votação!',
        ephemeral: true,
      });
    }
  },
};
