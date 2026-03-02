const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { loadCriadores, saveCriadores } = require('../../utils/file-handler');

/**
 * CONTEXT MENU: Add/Del Criador de Enquetes
 *
 * Adiciona ou remove um usuário da lista interna de Criadores de Enquetes.
 * Sistema 100% interno - não depende de cargos do Discord.
 */
module.exports = {
  data: new ContextMenuCommandBuilder().setName('Add/Del Criador de Enquetes').setType(ApplicationCommandType.User),

  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({
          content: '❌ Este comando só pode ser usado em servidores.',
          flags: MessageFlags.Ephemeral,
        });
      }

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

      const targetUser = interaction.targetUser;
      let targetMember = interaction.targetMember;

      if (!targetMember) {
        targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      }

      if (!targetMember) {
        return await interaction.reply({
          content: '❌ Não foi possível localizar o membro no servidor.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Carrega lista de criadores
      let data = loadCriadores();

      // Verifica se o usuário já é criador
      const jaCriador = data.criadores.includes(targetUser.id);

      if (jaCriador) {
        // REMOVER criador

        // Proteção: não pode remover a si mesmo se for o último criador
        const isLastCreator = data.criadores.length === 1;
        const isSelfRemoval = targetUser.id === interaction.user.id;

        if (isLastCreator && isSelfRemoval) {
          return await interaction.reply({
            content:
              '❌ **Você é o último Criador!** Não é possível se remover.\n_Adicione outro Criador antes de se remover._',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove da lista
        data.criadores = data.criadores.filter((id) => id !== targetUser.id);
        saveCriadores(data);

        await interaction.reply({
          content: `✅ **${targetUser.username}** foi removido(a) da lista de Criadores de Enquetes.\n_O usuário continua podendo votar normalmente._`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`Criador removido (contexto): ${targetUser.username} (${targetUser.id})`);
      } else {
        // ADICIONAR criador

        // Adiciona à lista
        data.criadores.push(targetUser.id);
        saveCriadores(data);

        await interaction.reply({
          content: `✅ **${targetUser.username}** foi adicionado(a) como Criador de Enquetes!\n_O usuário agora tem acesso administrativo total ao bot._`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`Criador adicionado (contexto): ${targetUser.username} (${targetUser.id})`);
      }
    } catch (error) {
      console.error('❌ Erro ao alternar Criador de Enquetes (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
