const { MessageFlags } = require('discord.js');
const { loadCriadores, loadRoleBindings } = require('./file-handler');

/**
 * SISTEMA DE PERMISSÕES BINÁRIO - VERSÃO INTERNA
 *
 * O bot opera com um modelo de permissões binário INTERNO:
 * - CRIADOR DE ENQUETES: Usuários adicionados internamente no arquivo criadores-internos.json
 * - CARGOS AUTORIZADOS: Cargos por servidor cadastrados em role-bindings.json
 * - USUÁRIO COMUM: Usuários não cadastrados podem apenas votar em enquetes ativas
 *
 * Administradores do Discord e dono do servidor também têm acesso total automaticamente.
 *
 * ⚠️ MUDANÇA IMPORTANTE: As permissões administrativas não dependem de cargos do Discord.
 * O gerenciamento principal continua interno por usuários, com suporte opcional a cargos autorizados por servidor.
 */

/**
 * Retorna IDs dos cargos autorizados para acesso administrativo em uma guild
 * @param {string} guildId - ID do servidor
 * @returns {string[]} lista de IDs de cargos autorizados
 */
function getAuthorizedAdminRoleIds(guildId) {
  if (!guildId) return [];

  const roleBindings = loadRoleBindings();
  const adminRoleIdsByGuild = roleBindings.adminRoleIdsByGuild && typeof roleBindings.adminRoleIdsByGuild === 'object' ? roleBindings.adminRoleIdsByGuild : {};
  const roleIds = adminRoleIdsByGuild[guildId];

  return Array.isArray(roleIds) ? roleIds : [];
}

/**
 * Verifica se o membro possui ao menos um cargo autorizado para acesso administrativo
 * @param {GuildMember} member - Membro do servidor
 * @returns {boolean} true se possui cargo autorizado
 */
function hasAuthorizedAdminRole(member) {
  const guildId = member?.guild?.id;
  const authorizedRoleIds = getAuthorizedAdminRoleIds(guildId);

  if (!authorizedRoleIds.length) {
    return false;
  }

  const roleCache = member?.roles?.cache;
  if (!roleCache) {
    return false;
  }

  return authorizedRoleIds.some((roleId) => roleCache.has(roleId));
}

/**
 * Verifica se um usuário possui acesso total (Criador de Enquetes/Admin/Dono do servidor)
 * @param {GuildMember} member - O membro do servidor a verificar
 * @returns {boolean} true se o usuário possui acesso total, false caso contrário
 */
function isCriador(member) {
  if (!member) {
    return false;
  }

  // Administrador ou dono do servidor tem acesso total
  if (member.permissions?.has('Administrator')) {
    return true;
  }

  if (member.guild?.ownerId && member.id === member.guild.ownerId) {
    return true;
  }

  // Carrega os criadores internos do arquivo (via file-handler)
  const criadoresData = loadCriadores();
  const criadores = criadoresData.criadores || [];

  // Verifica se o ID do usuário está na lista interna de criadores
  if (criadores.includes(member.id)) {
    return true;
  }

  return hasAuthorizedAdminRole(member);
}

/**
 * Mensagem padrão de permissão negada
 */
const MENSAGEM_PERMISSAO_NEGADA = '❌ **Permissão negada!** Apenas Criadores de Enquetes, membros com cargo autorizado, Administradores ou o dono do servidor podem executar este comando.';

/**
 * Verifica permissão e responde automaticamente se negado
 * @param {Interaction} interaction - Interação do Discord
 * @param {GuildMember} member - Membro a verificar
 * @returns {Promise<boolean>} true se tem permissão, false caso contrário (já responde a interação)
 */
async function checkPermissionReply(interaction, member) {
  if (!isCriador(member)) {
    await interaction.reply({
      content: MENSAGEM_PERMISSAO_NEGADA,
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
}

module.exports = {
  isCriador,
  getAuthorizedAdminRoleIds,
  hasAuthorizedAdminRole,
  MENSAGEM_PERMISSAO_NEGADA,
  checkPermissionReply,
};
