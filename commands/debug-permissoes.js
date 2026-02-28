const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, getAuthorizedAdminRoleIds } = require('../utils/permissions');
const { loadCriadores } = require('../utils/file-handler');

/**
 * COMANDO: /debug-permissoes
 * Exibe informações detalhadas sobre permissões do usuário
 * 
 * Útil para troubleshooting de problemas de acesso
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug-permissoes')
    .setDescription('🔍 [DEBUG] Verifica suas permissões no bot')
    .addUserOption((option) =>
      option
        .setName('usuario')
        .setDescription('Usuário a verificar (deixe vazio para verificar você mesmo)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      const targetMember = targetUser.id === interaction.user.id 
        ? interaction.member 
        : await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return await interaction.reply({
          content: '❌ Usuário não encontrado no servidor.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Carrega dados
      const criadoresData = loadCriadores();
      const criadores = criadoresData.criadores || [];
      const guildId = interaction.guildId;
      const authorizedRoleIds = getAuthorizedAdminRoleIds(guildId);

      // Verifica permissões
      const isAdmin = targetMember.permissions.has('Administrator');
      const isOwner = interaction.guild.ownerId === targetUser.id;
      const isCriadorInterno = criadores.includes(targetUser.id);
      const hasPermission = isCriador(targetMember, guildId);

      // Verifica cargos do usuário
      const memberRoles = targetMember.roles.cache
        .filter(role => role.id !== interaction.guildId) // Remove @everyone
        .map(role => `<@&${role.id}> (\`${role.id}\`)`)
        .join('\n') || 'Nenhum cargo';

      // Verifica cargos autorizados que o usuário possui
      const matchingRoles = authorizedRoleIds.filter(roleId => 
        targetMember.roles.cache.has(roleId)
      );

      // Monta embed
      const embed = new EmbedBuilder()
        .setColor(hasPermission ? '#00FF00' : '#FF0000')
        .setTitle('🔍 Debug de Permissões')
        .setDescription(`**Usuário:** ${targetUser.tag}\n**ID:** \`${targetUser.id}\``)
        .addFields(
          {
            name: '🎭 Permissões do Discord',
            value: 
              `**Administrador:** ${isAdmin ? '✅ Sim' : '❌ Não'}\n` +
              `**Dono do Servidor:** ${isOwner ? '✅ Sim' : '❌ Não'}`,
            inline: false
          },
          {
            name: '⚙️ Sistema Interno do Bot',
            value: 
              `**Criador de Enquetes:** ${isCriadorInterno ? '✅ Sim' : '❌ Não'}\n` +
              `**Listado em:** \`criadores-internos.json\``,
            inline: false
          },
          {
            name: '🎫 Cargos do Servidor',
            value: memberRoles,
            inline: false
          },
          {
            name: '🔐 Cargos Autorizados (role-bindings.json)',
            value: authorizedRoleIds.length > 0
              ? authorizedRoleIds.map(id => `<@&${id}> (\`${id}\`)`).join('\n')
              : '❌ Nenhum cargo autorizado configurado',
            inline: false
          },
          {
            name: '✅ Cargos Autorizados que o Usuário Possui',
            value: matchingRoles.length > 0
              ? matchingRoles.map(id => `<@&${id}> (\`${id}\`)`).join('\n')
              : '❌ Nenhum',
            inline: false
          },
          {
            name: '🎯 Resultado Final',
            value: hasPermission 
              ? '✅ **TEM PERMISSÃO** para usar comandos administrativos'
              : '❌ **SEM PERMISSÃO** para usar comandos administrativos',
            inline: false
          }
        )
        .setFooter({ 
          text: 'Para adicionar permissão use: /criador-de-enquete adicionar @usuario' 
        })
        .setTimestamp();

      await interaction.reply({ 
        embeds: [embed], 
        flags: MessageFlags.Ephemeral 
      });

      console.log(`🔍 [DEBUG] Permissões verificadas para ${targetUser.tag} por ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Erro ao executar debug-permissoes:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao verificar permissões.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
