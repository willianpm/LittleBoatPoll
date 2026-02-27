const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Add/Del Criador de Enquetes').setType(ApplicationCommandType.User).setDefaultMemberPermissions(0),

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

      let criadorRole = interaction.guild.roles.cache.find((role) => role.name === 'Criador de Enquetes');
      const legacyCriadorRole = interaction.guild.roles.cache.find((role) => role.name === 'Criador');

      if (criadorRole && legacyCriadorRole) {
        if (botMember.roles.highest.comparePositionTo(legacyCriadorRole) <= 0) {
          return await interaction.reply({
            content: '❌ Existe o cargo "Criador" legado, mas o bot nao consegue gerencia-lo.\n' + '➡️ Solucao: mova o cargo do bot para acima de "Criador" e tente novamente para remover o legado.',
            flags: MessageFlags.Ephemeral,
          });
        }

        await legacyCriadorRole.delete('Remover cargo Criador legado apos renomeacao').catch(() => null);
      }

      if (!criadorRole && legacyCriadorRole) {
        if (botMember.roles.highest.comparePositionTo(legacyCriadorRole) <= 0) {
          return await interaction.reply({
            content: '❌ O cargo "Criador" esta acima do cargo mais alto do bot.\n' + '➡️ Solucao: mova o cargo do bot para acima de "Criador" e tente novamente para renomear.',
            flags: MessageFlags.Ephemeral,
          });
        }

        criadorRole = await legacyCriadorRole.setName('Criador de Enquetes', 'Renomear cargo Criador para Criador de Enquetes').catch(() => null);

        if (!criadorRole) {
          return await interaction.reply({
            content: '❌ Nao foi possivel renomear o cargo "Criador" para "Criador de Enquetes". Ajuste a hierarquia e tente novamente.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (!criadorRole) {
        const isAdmin = interaction.member?.permissions?.has('Administrator');
        const isOwner = interaction.member?.id === interaction.guild.ownerId;

        if (!isAdmin && !isOwner) {
          return await interaction.reply({
            content: '❌ Cargo "Criador de Enquetes" nao encontrado. Apenas Administradores ou o dono do servidor podem cria-lo automaticamente.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const desiredPosition = botMember.roles.highest.position - 1;
        const roleOptions = {
          name: 'Criador de Enquetes',
          reason: 'Criacao automatica do cargo Criador de Enquetes para o context menu',
        };

        if (desiredPosition > 0) {
          roleOptions.position = desiredPosition;
        }

        criadorRole = await interaction.guild.roles.create(roleOptions).catch(() => null);

        if (!criadorRole) {
          return await interaction.reply({
            content: '❌ Cargo "Criador de Enquetes" nao encontrado e nao foi possivel cria-lo automaticamente.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // =====================================
      // VERIFICACAO DE PERMISSOES
      // Apenas usuarios com o cargo "Criador de Enquetes" podem executar este comando
      // =====================================
      const isAdmin = interaction.member?.permissions?.has('Administrator');
      const isOwner = interaction.member?.id === interaction.guild.ownerId;
      const hasCriadorRole = interaction.member?.roles?.cache?.has(criadorRole.id);

      if (!hasCriadorRole && !isAdmin && !isOwner) {
        return await interaction.reply({
          content: '❌ Permissao negada! Apenas usuarios com o cargo "Criador de Enquetes", Administradores ou o dono do servidor podem executar este comando.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (botMember.roles.highest.comparePositionTo(criadorRole) <= 0) {
        return await interaction.reply({
          content: '❌ O cargo "Criador de Enquetes" esta acima do cargo mais alto do bot.\n' + '➡️ Solucao: mova o cargo do bot para acima de "Criador de Enquetes" ou mova "Criador de Enquetes" para baixo na hierarquia.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const targetHasCriadorRole = targetMember.roles.cache.has(criadorRole.id);

      if (targetHasCriadorRole) {
        await targetMember.roles.remove(criadorRole, 'Context menu: Remover Criador de Enquetes');
        await interaction.reply({
          content: `✅ Cargo "Criador de Enquetes" removido de ${targetUser.username}.`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`❌ Criador de Enquetes removido (contexto): ${targetUser.username} (${targetUser.id})`);
      } else {
        await targetMember.roles.add(criadorRole, 'Context menu: Adicionar Criador de Enquetes');
        await interaction.reply({
          content: `✅ Cargo "Criador de Enquetes" adicionado a ${targetUser.username}.`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`✅ Criador de Enquetes adicionado (contexto): ${targetUser.username} (${targetUser.id})`);
      }
    } catch (error) {
      console.error('❌ Erro ao alternar cargo Criador de Enquetes (contexto):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
