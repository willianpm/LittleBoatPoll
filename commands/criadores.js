const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../utils/permissions');
const { loadCargos, saveCargos } = require('../utils/file-handler');

/**
 * COMANDO: /criadores
 * Gerencia os cargos Criador (acesso total ao bot)
 *
 * Subcomandos:
 * - adicionar: Adiciona um cargo à lista de criadores
 * - remover: Remove um cargo da lista de criadores
 * - listar: Lista todos os cargos Criador
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('criadores')
    .setDescription('Gerencia os cargos "Criador de Enquetes" (acesso total ao bot)')
    .setDefaultMemberPermissions(0)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar')
        .setDescription('Adiciona um cargo "Criador de Enquetes"')
        .addRoleOption((option) => option.setName('cargo').setDescription('Cargo a ser adicionado').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('Remove um cargo "Criador de Enquetes"')
        .addRoleOption((option) => option.setName('cargo').setDescription('Cargo a ser removido').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('listar').setDescription('Lista todos os cargos Criador')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // =====================================
    // VERIFICAÇÃO DE PERMISSÕES - SISTEMA BINÁRIO
    // Apenas usuários com o cargo "Criador de Enquetes" podem executar este comando
    // =====================================
    if (!isCriador(interaction.member)) {
      return await interaction.reply({
        content: MENSAGEM_PERMISSAO_NEGADA,
        flags: MessageFlags.Ephemeral,
      });
    }

    const filePath = './cargos-criadores.json';

    // Carrega ou inicializa o arquivo JSON
    let data = loadCargos();

    // =====================================
    // SUBCOMANDO: ADICIONAR
    // =====================================
    if (subcommand === 'adicionar') {
      const cargo = interaction.options.getRole('cargo');

      // Verifica se já está na lista
      if (data.cargos.includes(cargo.id)) {
        return await interaction.reply({
          content: `❌ O cargo **${cargo.name}** já está na lista de Criadores!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Adiciona à lista
      data.cargos.push(cargo.id);
      saveCargos(data);

      const embed = new EmbedBuilder().setColor('#00FF00').setTitle('✅ Cargo "Criador de Enquetes" Adicionado!').setDescription(`O cargo **${cargo.name}** agora tem acesso total ao bot.`).setTimestamp();

      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: REMOVER
    // =====================================
    if (subcommand === 'remover') {
      const cargo = interaction.options.getRole('cargo');

      // Verifica se está na lista
      if (!data.cargos.includes(cargo.id)) {
        return await interaction.reply({
          content: `❌ O cargo **${cargo.name}** não está na lista de Criadores!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Remove da lista
      data.cargos = data.cargos.filter((id) => id !== cargo.id);
      saveCargos(data);

      const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🗑️ Cargo "Criador de Enquetes" Removido!').setDescription(`O cargo **${cargo.name}** não tem mais acesso total ao bot.`).setTimestamp();

      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: LISTAR
    // =====================================
    if (subcommand === 'listar') {
      if (data.cargos.length === 0) {
        const embed = new EmbedBuilder().setColor('#FFA500').setTitle('📋 Cargos Criadores').setDescription('Nenhum cargo Criador definido ainda.\n\n_Adicione um cargo para permitir acesso total ao bot._').setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: false });
      }

      // Busca os nomes dos cargos
      let lista = '';
      for (const cargoId of data.cargos) {
        try {
          const cargo = await interaction.guild.roles.fetch(cargoId);
          if (cargo) {
            lista += `• ${cargo.name} (ID: \`${cargoId}\`)\n`;
          } else {
            lista += `• Cargo não encontrado (ID: \`${cargoId}\`)\n`;
          }
        } catch (error) {
          lista += `• Erro ao buscar cargo (ID: \`${cargoId}\`)\n`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#4169E1')
        .setTitle('📋 Cargos "Criador de Enquetes" (Acesso Total)')
        .setDescription((lista || 'Nenhum cargo encontrado.') + '\n\n_Usuários com estes cargos têm acesso total ao bot._\n_Usuários sem estes cargos podem apenas votar._')
        .setFooter({ text: `Total: ${data.cargos.length} cargo(s)` })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: false });
    }
  },
};
