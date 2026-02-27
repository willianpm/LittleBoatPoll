const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../utils/permissions');
const { loadCriadores, saveCriadores } = require('../utils/file-handler');

/**
 * COMANDO: /criador
 * Gerencia os criadores de enquetes (acesso total ao bot) - SISTEMA INTERNO
 *
 * Este comando substitui o antigo sistema de cargos do Discord.
 * Agora as permissões são gerenciadas internamente pelo bot através de IDs de usuários.
 *
 * Subcomandos:
 * - adicionar: Adiciona um usuário à lista de criadores internos
 * - remover: Remove um usuário da lista de criadores internos
 * - listar: Lista todos os criadores cadastrados
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('criador')
    .setDescription('Gerencia os Criadores de Enquetes (acesso administrativo interno)')
    .setDefaultMemberPermissions(0)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar')
        .setDescription('Adiciona um usuário como Criador de Enquetes')
        .addUserOption((option) => option.setName('usuario').setDescription('Usuário a ser adicionado').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('Remove um usuário da lista de Criadores')
        .addUserOption((option) => option.setName('usuario').setDescription('Usuário a ser removido').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('listar').setDescription('Lista todos os Criadores de Enquetes')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // =====================================
    // VERIFICAÇÃO DE PERMISSÕES
    // Apenas Criadores, Administradores ou dono do servidor
    // =====================================
    if (!isCriador(interaction.member)) {
      return await interaction.reply({
        content: MENSAGEM_PERMISSAO_NEGADA,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Carrega ou inicializa o arquivo JSON
    let data = loadCriadores();

    // =====================================
    // SUBCOMANDO: ADICIONAR
    // =====================================
    if (subcommand === 'adicionar') {
      const usuario = interaction.options.getUser('usuario');

      // Verifica se já está na lista
      if (data.criadores.includes(usuario.id)) {
        return await interaction.reply({
          content: `❌ O usuário **${usuario.username}** já é um Criador de Enquetes!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Adiciona à lista
      data.criadores.push(usuario.id);
      saveCriadores(data);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Criador de Enquetes Adicionado!')
        .setDescription(`**${usuario.username}** (${usuario.id}) agora tem acesso administrativo total ao bot.`)
        .addFields({
          name: '📋 Permissões Concedidas',
          value: '• Criar e gerenciar enquetes\n• Adicionar/remover mensalistas\n• Encerrar votações\n• Gerenciar rascunhos\n• Gerenciar outros criadores',
        })
        .setTimestamp();

      console.log(`✅ Criador adicionado: ${usuario.username} (${usuario.id})`);
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: REMOVER
    // =====================================
    if (subcommand === 'remover') {
      const usuario = interaction.options.getUser('usuario');

      // Verifica se está na lista
      if (!data.criadores.includes(usuario.id)) {
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
          content: '❌ **Você é o último Criador!** Não é possível se remover.\n_Adicione outro Criador antes de se remover._',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Remove da lista
      data.criadores = data.criadores.filter((id) => id !== usuario.id);
      saveCriadores(data);

      const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🗑️ Criador de Enquetes Removido!').setDescription(`**${usuario.username}** (${usuario.id}) não tem mais acesso administrativo ao bot.`).setFooter({ text: 'Usuário continua podendo votar normalmente' }).setTimestamp();

      console.log(`❌ Criador removido: ${usuario.username} (${usuario.id})`);
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: LISTAR
    // =====================================
    if (subcommand === 'listar') {
      if (data.criadores.length === 0) {
        const embed = new EmbedBuilder().setColor('#FFA500').setTitle('📋 Criadores de Enquetes').setDescription('Nenhum Criador cadastrado internamente ainda.\n\n_⚠️ Apenas Administradores e o dono do servidor têm acesso administrativo no momento._\n\n_Use `/criador adicionar` para cadastrar um usuário._').setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: false });
      }

      // Busca informações dos usuários
      let lista = '';
      let usuariosNaoEncontrados = 0;

      for (const userId of data.criadores) {
        try {
          const user = await interaction.client.users.fetch(userId);
          if (user) {
            lista += `• **${user.username}** (ID: \`${userId}\`)\n`;
          } else {
            lista += `• _Usuário não encontrado_ (ID: \`${userId}\`)\n`;
            usuariosNaoEncontrados++;
          }
        } catch (error) {
          lista += `• _Erro ao buscar usuário_ (ID: \`${userId}\`)\n`;
          usuariosNaoEncontrados++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#4169E1')
        .setTitle('📋 Criadores de Enquetes (Sistema Interno)')
        .setDescription(lista + '\n\n_✅ Estes usuários têm acesso administrativo total ao bot._\n' + '_📌 Permissões gerenciadas internamente (não dependem de cargos do Discord)._\n' + '_👥 Administradores e dono do servidor também têm acesso total._')
        .setFooter({ text: `Total: ${data.criadores.length} criador(es) cadastrado(s)` })
        .setTimestamp();

      if (usuariosNaoEncontrados > 0) {
        embed.addFields({
          name: '⚠️ Aviso',
          value: `${usuariosNaoEncontrados} usuário(s) não foram encontrados. Podem ter saído do servidor ou excluído a conta.`,
        });
      }

      return await interaction.reply({ embeds: [embed], ephemeral: false });
    }
  },
};
