const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../utils/permissions');
const { loadCargos, saveCargos } = require('../utils/file-handler');

/**
 * COMANDO: /criadores (DEPRECATED)
 * Gerencia os cargos Criador (acesso total ao bot)
 *
 * ⚠️ ESTE COMANDO ESTÁ DESCONTINUADO
 * Use o novo comando /criador que gerencia permissões internamente.
 *
 * Este comando ainda funciona para gerenciar cargos do Discord,
 * mas o sistema de permissões não depende mais de cargos.
 *
 * Subcomandos:
 * - adicionar: Adiciona um cargo à lista de criadores (não funciona mais)
 * - remover: Remove um cargo da lista de criadores (não funciona mais)
 * - listar: Lista todos os cargos Criador (não funciona mais)
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('criadores')
    .setDescription('[DESCONTINUADO] Use /criador - Gerenciava cargos Criador (sistema antigo)')
    .setDefaultMemberPermissions(0)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar')
        .setDescription('[DESCONTINUADO] Use /criador adicionar')
        .addRoleOption((option) => option.setName('cargo').setDescription('Este comando não funciona mais').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('[DESCONTINUADO] Use /criador remover')
        .addRoleOption((option) => option.setName('cargo').setDescription('Este comando não funciona mais').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('listar').setDescription('[DESCONTINUADO] Use /criador listar')),

  async execute(interaction) {
    // Mensagem de descontinuação
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⚠️ Comando Descontinuado')
      .setDescription('**Este comando foi substituído pelo novo sistema interno de permissões.**\n\n' + 'O bot agora gerencia permissões internamente, sem depender de cargos do Discord.\n\n' + '**Use os novos comandos:**\n' + '• `/criador adicionar @usuario` - Adiciona um Criador\n' + '• `/criador remover @usuario` - Remove um Criador\n' + '• `/criador listar` - Lista todos os Criadores\n' + '• **Context Menu** - Clique com botão direito em um usuário → Apps → "Add/Del Criador de Enquetes"\n\n' + '**Vantagens do novo sistema:**\n' + '✅ Não precisa criar cargos no servidor\n' + '✅ Mais simples de gerenciar\n' + '✅ Não depende de hierarquia de cargos\n' + '✅ Permissões persistem mesmo se cargos forem deletados')
      .setFooter({ text: 'Este comando será removido em versões futuras' })
      .setTimestamp();

    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
