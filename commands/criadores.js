const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');

/**
 * COMANDO: /criadores
 * Gerencia os cargos que podem criar enquetes
 *
 * Subcomandos:
 * - adicionar: Adiciona um cargo à lista de criadores
 * - remover: Remove um cargo da lista de criadores
 * - listar: Lista todos os cargos autorizados
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('criadores')
    .setDescription('Gerencia os cargos autorizados a criar enquetes')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar')
        .setDescription('Adiciona um cargo à lista de criadores')
        .addRoleOption((option) => option.setName('cargo').setDescription('Cargo a ser adicionado').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('Remove um cargo da lista de criadores')
        .addRoleOption((option) => option.setName('cargo').setDescription('Cargo a ser removido').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('listar').setDescription('Lista todos os cargos autorizados a criar enquetes'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // =====================================
    // VERIFICAÇÃO DE PERMISSÕES (adicionar/remover)
    // =====================================
    if ((subcommand === 'adicionar' || subcommand === 'remover') && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ **Permissão negada!** Apenas administradores podem gerenciar os cargos criadores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const filePath = './cargos-criadores.json';

    // Carrega ou inicializa o arquivo JSON
    let data = { cargos: [] };
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // =====================================
    // SUBCOMANDO: ADICIONAR
    // =====================================
    if (subcommand === 'adicionar') {
      const cargo = interaction.options.getRole('cargo');

      // Verifica se já está na lista
      if (data.cargos.includes(cargo.id)) {
        return await interaction.reply({
          content: `❌ O cargo **${cargo.name}** já está autorizado a criar enquetes!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Adiciona à lista
      data.cargos.push(cargo.id);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      const embed = new EmbedBuilder().setColor('#00FF00').setTitle('✅ Cargo Adicionado!').setDescription(`O cargo **${cargo.name}** agora pode criar enquetes.`).setTimestamp();

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
          content: `❌ O cargo **${cargo.name}** não está na lista de criadores!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Remove da lista
      data.cargos = data.cargos.filter((id) => id !== cargo.id);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🗑️ Cargo Removido!').setDescription(`O cargo **${cargo.name}** não pode mais criar enquetes.`).setTimestamp();

      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // =====================================
    // SUBCOMANDO: LISTAR
    // =====================================
    if (subcommand === 'listar') {
      if (data.cargos.length === 0) {
        const embed = new EmbedBuilder().setColor('#FFA500').setTitle('📋 Cargos Criadores').setDescription('Nenhum cargo autorizado ainda.\n\n_Apenas administradores podem criar enquetes no momento._').setTimestamp();

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
        .setTitle('📋 Cargos Autorizados a Criar Enquetes')
        .setDescription(lista || 'Nenhum cargo encontrado.')
        .setFooter({ text: `Total: ${data.cargos.length} cargo(s)` })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: false });
    }
  },
};
