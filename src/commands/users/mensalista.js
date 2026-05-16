const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador } = require('../../utils/permissions');
const { loadMensalistas, saveMensalistas } = require('../../utils/file-handler');
const { buildMensalistaToggleEmbed, replyPermissionDenied, replyEphemeral } = require('../../utils/response-builders');
const { handleCommandError } = require('../../utils/error-handler');
const logger = require('../../utils/logger');

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
        return await replyPermissionDenied(interaction);
      }

      // Lê o arquivo de mensalistas
      let mensalistasData = loadMensalistas();
      const monthlyMemberExists = (userId) => mensalistasData.mensalistas.some((entry) => entry.id === userId);

      // ====================================
      // SUBCOMANDO: ADICIONAR
      // ====================================
      if (subcommand === 'adicionar') {
        const usuario = interaction.options.getUser('usuario');

        // Verifica se o usuário já está na lista
        if (monthlyMemberExists(usuario.id)) {
          return await interaction.reply({
            content: `⚠️ ${usuario.username} já está na lista de mensalistas!`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Adiciona o usuário
        mensalistasData.mensalistas.push({
          id: usuario.id,
          addedAt: new Date().toISOString(),
          addedBy: interaction.user.id,
        });
        saveMensalistas(mensalistasData);

        const addEmbed = buildMensalistaToggleEmbed({ username: usuario.username, added: true });
        await replyEphemeral(interaction, { embeds: [addEmbed] });
        logger.info(`Mensalista adicionado: ${usuario.username} (${usuario.id})`);
      }

      // ====================================
      // SUBCOMANDO: REMOVER
      // ====================================
      else if (subcommand === 'remover') {
        const usuario = interaction.options.getUser('usuario');

        // Verifica se o usuário está na lista
        const index = mensalistasData.mensalistas.findIndex((entry) => entry.id === usuario.id);

        if (index === -1) {
          return await interaction.reply({
            content: `⚠️ ${usuario.username} não está na lista de mensalistas!`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove o usuário
        mensalistasData.mensalistas.splice(index, 1);
        saveMensalistas(mensalistasData);

        const removeEmbed = buildMensalistaToggleEmbed({ username: usuario.username, added: false });
        await replyEphemeral(interaction, { embeds: [removeEmbed] });
        logger.info(`Mensalista removido: ${usuario.username} (${usuario.id})`);
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
            const mensalistaUser = await client.users.fetch(mensalistaId.id);
            const addedAt = mensalistaId.addedAt
              ? ` | Adicionado em: <t:${Math.floor(new Date(mensalistaId.addedAt).getTime() / 1000)}:f>`
              : '';
            listaTexto += `• ${mensalistaUser.username} (${mensalistaUser.id})${addedAt}\n`;
          } catch (error) {
            const addedAt = mensalistaId.addedAt
              ? ` | Adicionado em: <t:${Math.floor(new Date(mensalistaId.addedAt).getTime() / 1000)}:f>`
              : '';
            listaTexto += `• ID: ${mensalistaId.id} (usuário não encontrado)${addedAt}\n`;
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
        logger.info(`Lista de mensalistas solicitada: ${mensalistasData.mensalistas.length} membros`);
      }
    } catch (error) {
      await handleCommandError(interaction, error, 'mensalista');
    }
  },
};
