const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { loadCriadores, saveCriadores } = require('../../utils/file-handler');
const logger = require('../../utils/logger');

/**
 * COMANDO: /criador-de-enquete
 * Gerencia os criadores de enquetes (acesso total ao bot) - SISTEMA INTERNO
 *
 * Subcomandos:
 * - adicionar: Adiciona um usuário à lista de criadores internos
 * - remover: Remove um usuário da lista de criadores internos
 * - listar: Lista todos os criadores cadastrados
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('criador-de-enquete')
    .setDescription('Gerencia os Criadores de Enquetes (acesso administrativo interno)')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar')
        .setDescription('Adiciona um usuário como Criador de Enquetes')
        .addUserOption((option) =>
          option.setName('usuario').setDescription('Usuário a ser adicionado').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('Remove um usuário da lista de Criadores')
        .addUserOption((option) =>
          option.setName('usuario').setDescription('Usuário a ser removido').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName('listar').setDescription('Lista todos os Criadores de Enquetes')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // =====================================
    // VERIFICAÇÃO DE PERMISSÕES
    // Apenas Criadores, Administradores ou dono do servidor
    // =====================================
    if (!isCriador(interaction.member, interaction.guildId)) {
      return await interaction.reply({
        content: MENSAGEM_PERMISSAO_NEGADA,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Carrega ou inicializa o arquivo JSON
    let data = loadCriadores();
    const hasCreator = (userId) => data.criadores.some((entry) => entry.id === userId);

    // =====================================
    // SUBCOMANDO: ADICIONAR
    // =====================================
    if (subcommand === 'adicionar') {
      const usuario = interaction.options.getUser('usuario');

      // Verifica se já está na lista
      if (hasCreator(usuario.id)) {
        return await interaction.reply({
          content: `❌ O usuário **${usuario.username}** já é um Criador de Enquetes!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Adiciona à lista
      data.criadores.push({
        id: usuario.id,
        addedAt: new Date().toISOString(),
        addedBy: interaction.user.id,
      });
      saveCriadores(data);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Criador de Enquetes Adicionado!')
        .setDescription(`**${usuario.username}** (${usuario.id}) agora tem acesso administrativo total ao bot.`)
        .addFields({
          name: '📋 Permissões Concedidas',
          value:
            '• Criar e gerenciar enquetes\n' +
            '• Adicionar/remover mensalistas\n' +
            '• Encerrar votações\n' +
            '• Gerenciar rascunhos\n' +
            '• Gerenciar outros criadores',
        })
        .setTimestamp();

      logger.info(`Criador adicionado: ${usuario.username} (${usuario.id})`);
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: REMOVER
    // =====================================
    if (subcommand === 'remover') {
      const usuario = interaction.options.getUser('usuario');

      // Verifica se está na lista
      if (!hasCreator(usuario.id)) {
        return await interaction.reply({
          content: `❌ O usuário **${usuario.username}** não está na lista de Criadores!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Proteção: não pode remover a si mesmo se for o último criador
      const isLastCreator = data.criadores.length === 1;
      const isSelfRemoval = usuario.id === interaction.user.id;

      if (isLastCreator && isSelfRemoval) {
        return await interaction.reply({
          content:
            '❌ **Você é o último Criador!** Não é possível se remover.\n_Adicione outro Criador antes de se remover._',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Remove da lista
      data.criadores = data.criadores.filter((entry) => entry.id !== usuario.id);
      saveCriadores(data);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🗑️ Criador de Enquetes Removido!')
        .setDescription(`**${usuario.username}** (${usuario.id}) não tem mais acesso administrativo ao bot.`)
        .setFooter({ text: 'Usuário continua podendo votar normalmente' })
        .setTimestamp();

      logger.info(`Criador removido: ${usuario.username} (${usuario.id})`);
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: LISTAR
    // =====================================
    if (subcommand === 'listar') {
      if (data.criadores.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('📋 Criadores de Enquetes')
          .setDescription(
            'Nenhum Criador cadastrado internamente ainda.\n\n' +
              '_⚠️ Apenas Administradores e o dono do servidor têm acesso administrativo no momento._\n\n' +
              '_Use `/criador-de-enquete adicionar` para cadastrar um usuário._',
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      // Busca informações dos usuários
      let lista = '';
      let usuariosNaoEncontrados = 0;

      for (const userId of data.criadores) {
        try {
          const user = await interaction.client.users.fetch(userId.id);
          if (user) {
            const addedAt = userId.addedAt
              ? ` | Adicionado em: <t:${Math.floor(new Date(userId.addedAt).getTime() / 1000)}:f>`
              : '';
            lista += `• **${user.username}** (ID: \`${userId.id}\`)${addedAt}\n`;
          } else {
            const addedAt = userId.addedAt
              ? ` | Adicionado em: <t:${Math.floor(new Date(userId.addedAt).getTime() / 1000)}:f>`
              : '';
            lista += `• _Usuário não encontrado_ (ID: \`${userId.id}\`)${addedAt}\n`;
            usuariosNaoEncontrados++;
          }
        } catch (error) {
          const addedAt = userId.addedAt
            ? ` | Adicionado em: <t:${Math.floor(new Date(userId.addedAt).getTime() / 1000)}:f>`
            : '';
          lista += `• _Erro ao buscar usuário_ (ID: \`${userId.id}\`)${addedAt}\n`;
          usuariosNaoEncontrados++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#4169E1')
        .setTitle('📋 Criadores de Enquetes (Sistema Interno)')
        .setDescription(
          lista +
            '\n\n_✅ Estes usuários têm acesso administrativo total ao bot._\n' +
            '_📌 Permissões gerenciadas internamente (não dependem de cargos do Discord)._\n' +
            '_👥 Administradores e dono do servidor também têm acesso total._',
        )
        .setFooter({ text: `Total: ${data.criadores.length} criador(es) cadastrado(s)` })
        .setTimestamp();

      if (usuariosNaoEncontrados > 0) {
        embed.addFields({
          name: '⚠️ Aviso',
          value:
            `${usuariosNaoEncontrados} usuário(s) não foram encontrados. ` +
            'Podem ter saído do servidor ou excluído a conta.',
        });
      }

      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};
