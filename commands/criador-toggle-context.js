const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Adicionar/Remover Criador').setType(ApplicationCommandType.User).setDefaultMemberPermissions(0),

  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({
          content: '❌ Este comando so pode ser usado em servidores.',
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
          content: '❌ Nao foi possivel localizar o membro no servidor.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const botMember = interaction.guild.members.me;
      if (!botMember?.permissions?.has('ManageRoles')) {
        return await interaction.reply({
          content: '❌ O bot nao possui permissao para gerenciar cargos.',
          flags: MessageFlags.Ephemeral,
        });
      }

      let criadorRole = interaction.guild.roles.cache.find((role) => role.name === 'Criador');

      if (!criadorRole) {
        const isAdmin = interaction.member?.permissions?.has('Administrator');
        const isOwner = interaction.member?.id === interaction.guild.ownerId;

        if (!isAdmin && !isOwner) {
          return await interaction.reply({
            content: '❌ Cargo "Criador" nao encontrado. Apenas Administradores ou o dono do servidor podem cria-lo automaticamente.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const desiredPosition = botMember.roles.highest.position - 1;
        const roleOptions = {
          name: 'Criador',
          reason: 'Criacao automatica do cargo Criador para o context menu',
        };

        if (desiredPosition > 0) {
          roleOptions.position = desiredPosition;
        }

        criadorRole = await interaction.guild.roles.create(roleOptions).catch(() => null);

        if (!criadorRole) {
          return await interaction.reply({
            content: '❌ Cargo "Criador" nao encontrado e nao foi possivel cria-lo automaticamente.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // =====================================
      // VERIFICACAO DE PERMISSOES
      // Apenas usuarios com o cargo Criador podem executar este comando
      // =====================================
      const isAdmin = interaction.member?.permissions?.has('Administrator');
      const isOwner = interaction.member?.id === interaction.guild.ownerId;
      const hasCriadorRole = interaction.member?.roles?.cache?.has(criadorRole.id);

      if (!hasCriadorRole && !isAdmin && !isOwner) {
        return await interaction.reply({
          content: '❌ Permissao negada! Apenas usuarios com o cargo "Criador" podem executar este comando.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (botMember.roles.highest.comparePositionTo(criadorRole) <= 0) {
        return await interaction.reply({
          content: '❌ O cargo "Criador" esta acima do cargo mais alto do bot.\n' + '➡️ Solucao: mova o cargo do bot para acima de "Criador" ou mova "Criador" para baixo na hierarquia.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const targetHasCriadorRole = targetMember.roles.cache.has(criadorRole.id);

      if (targetHasCriadorRole) {
        await targetMember.roles.remove(criadorRole, 'Context menu: Remover Criador');
        await interaction.reply({
          content: `✅ Cargo "Criador" removido de ${targetUser.username}.`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`❌ Criador removido (contexto): ${targetUser.username} (${targetUser.id})`);
      } else {
        await targetMember.roles.add(criadorRole, 'Context menu: Adicionar Criador');
        await interaction.reply({
          content: `✅ Cargo "Criador" adicionado a ${targetUser.username}.`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`✅ Criador adicionado (contexto): ${targetUser.username} (${targetUser.id})`);
      }
    } catch (error) {
      console.error('❌ Erro ao alternar cargo Criador (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
