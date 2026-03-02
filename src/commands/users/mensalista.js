const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { loadMensalistas, saveMensalistas } = require('../../utils/file-handler');

/**
 * COMANDO: /mensalista
 * Gerencia a lista de mensalistas do Clube do Livro
 *
 * Subcomandos:
 * - adicionar @usuario: Adiciona um usuário à lista de mensalistas
 * - remover @usuario: Remove um usuário da lista de mensalistas
 * - listar: Mostra todos os mensalistas cadastrados
 *
 * PERMISSÃO: Apenas usuários com o cargo Criador podem adicionar/remover
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('mensalista')
    .setDescription('Gerencia a lista de mensalistas do Clube do Livro')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar')
        .setDescription('Adiciona um usuário à lista de mensalistas')
        .addUserOption((option) => option.setName('usuario').setDescription('Usuário a adicionar').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('Remove um usuário da lista de mensalistas')
        .addUserOption((option) => option.setName('usuario').setDescription('Usuário a remover').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('listar').setDescription('Lista todos os mensalistas cadastrados'),
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

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

      // Lê o arquivo de mensalistas
      let mensalistasData = loadMensalistas();

      // ====================================
      // SUBCOMANDO: ADICIONAR
      // ====================================
      if (subcommand === 'adicionar') {
        const usuario = interaction.options.getUser('usuario');

        // Verifica se o usuário já está na lista
        if (mensalistasData.mensalistas.includes(usuario.id)) {
          return await interaction.reply({
            content: `⚠️ ${usuario.username} já está na lista de mensalistas!`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Adiciona o usuário
        mensalistasData.mensalistas.push(usuario.id);
        saveMensalistas(mensalistasData);

        const addEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ MENSALISTA ADICIONADO')
          .setDescription(`${usuario.username} foi adicionado à lista de mensalistas!`)
          .addFields({
            name: 'Benefício',
            value: 'Seus votos agora contam como peso 2 (dobrado!) 📈',
            inline: false,
          })
          .setFooter({ text: 'Parabéns! 🎉' })
          .setTimestamp();

        await interaction.reply({ embeds: [addEmbed], flags: MessageFlags.Ephemeral });
        console.log(`Mensalista adicionado: ${usuario.username} (${usuario.id})`);
      }

      // ====================================
      // SUBCOMANDO: REMOVER
      // ====================================
      else if (subcommand === 'remover') {
        const usuario = interaction.options.getUser('usuario');

        // Verifica se o usuário está na lista
        const index = mensalistasData.mensalistas.indexOf(usuario.id);

        if (index === -1) {
          return await interaction.reply({
            content: `⚠️ ${usuario.username} não está na lista de mensalistas!`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove o usuário
        mensalistasData.mensalistas.splice(index, 1);
        saveMensalistas(mensalistasData);

        const removeEmbed = new EmbedBuilder()
          .setColor('#FF6600')
          .setTitle('❌ MENSALISTA REMOVIDO')
          .setDescription(`${usuario.username} foi removido da lista de mensalistas.`)
          .addFields({
            name: 'Mudança',
            value: 'Seus futuros votos contarão como peso 1 novamente.',
            inline: false,
          })
          .setTimestamp();

        await interaction.reply({ embeds: [removeEmbed], flags: MessageFlags.Ephemeral });
        console.log(`Mensalista removido: ${usuario.username} (${usuario.id})`);
      }

      // ====================================
      // SUBCOMANDO: LISTAR
      // ====================================
      else if (subcommand === 'listar') {
        if (mensalistasData.mensalistas.length === 0) {
          return await interaction.reply({
            content: '📋 Nenhum mensalista cadastrado no momento.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Busca os nomes dos usuários
        let listaTexto = '';
        for (const mensalistaId of mensalistasData.mensalistas) {
          try {
            const mensalistaUser = await client.users.fetch(mensalistaId);
            listaTexto += `• ${mensalistaUser.username} (${mensalistaUser.id})\n`;
          } catch (error) {
            listaTexto += `• ID: ${mensalistaId} (usuário não encontrado)\n`;
          }
        }

        const listEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('👑 LISTA DE MENSALISTAS')
          .setDescription('Estes membros têm seus votos contando em peso 2 (dobrado!)')
          .addFields({
            name: `Total: ${mensalistasData.mensalistas.length}`,
            value: listaTexto,
            inline: false,
          })
          .setFooter({ text: 'Peso 2 = Votos valem o dobro' })
          .setTimestamp();

        await interaction.reply({ embeds: [listEmbed], flags: MessageFlags.Ephemeral });
        console.log(`Lista de mensalistas solicitada: ${mensalistasData.mensalistas.length} membros`);
      }
    } catch (error) {
      console.error('Erro ao gerenciar mensalistas:', error);
      await interaction.reply({
        content: '❌ Erro ao processar o comando!',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
