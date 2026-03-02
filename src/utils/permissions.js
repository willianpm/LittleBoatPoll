const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { loadCriadores, loadRoleBindings } = require('./file-handler');

function extractSnowflake(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/\d{5,}/);
    return match ? match[0] : trimmed;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  return null;
}

function getMemberId(member) {
  return extractSnowflake(member?.id) || extractSnowflake(member?.user?.id);
}

function hasAdministratorPermission(member) {
  if (!member) return false;

  if (typeof member.permissions?.has === 'function') {
    return member.permissions.has(PermissionFlagsBits.Administrator);
  }

  const rawPermissions = member.permissions;
  if (rawPermissions === null || rawPermissions === undefined) {
    return false;
  }

  try {
    const permissionBits = typeof rawPermissions === 'bigint' ? rawPermissions : BigInt(rawPermissions);
    return (permissionBits & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator;
  } catch {
    return false;
  }
}

function getMemberRoleIds(member) {
  const roleCache = member?.roles?.cache;
  if (roleCache && typeof roleCache.has === 'function' && typeof roleCache.keys === 'function') {
    return Array.from(roleCache.keys());
  }

  if (Array.isArray(member?.roles)) {
    return member.roles.map((roleId) => extractSnowflake(roleId)).filter(Boolean);
  }

  if (Array.isArray(member?._roles)) {
    return member._roles.map((roleId) => extractSnowflake(roleId)).filter(Boolean);
  }

  return [];
}

function resolveGuildId(member, guildIdOverride) {
  return extractSnowflake(guildIdOverride) || extractSnowflake(member?.guild?.id);
}

/**
 * SISTEMA DE PERMISSÕES BINÁRIO - VERSÃO INTERNA
 *
 * O bot opera com um modelo de permissões binário INTERNO:
 * - CRIADOR DE ENQUETES: Usuários adicionados internamente no arquivo criadores-internos.json
 * - USUÁRIO COMUM: Usuários não cadastrados podem apenas votar em enquetes ativas
 *
 * Administradores do Discord e dono do servidor também têm acesso total automaticamente.
 */

/**
 * Verifica se um usuário possui acesso total (Criador de Enquetes/Admin/Dono do servidor)
 * @param {GuildMember} member - O membro do servidor a verificar
 * @returns {boolean} true se o usuário possui acesso total, false caso contrário
 */
function isCriador(member, guildIdOverride) {
  if (!member) {
    return false;
  }

  // Administrador ou dono do servidor tem acesso total
  if (hasAdministratorPermission(member)) {
    return true;
  }

  const memberId = getMemberId(member);

  if (member.guild?.ownerId && memberId && memberId === member.guild.ownerId) {
    return true;
  }

  // Carrega os criadores internos do arquivo (via file-handler)
  const criadoresData = loadCriadores();
  const criadores = criadoresData.criadores || [];

  // Verifica se o ID do usuário está na lista interna de criadores
  if (memberId && criadores.includes(memberId)) {
    return true;
  }

  return false;
}

/**
 * Mensagem padrão de permissão negada
 */
const MENSAGEM_PERMISSAO_NEGADA = '❌ **Permissão negada!** Apenas Criadores de Enquetes, Administradores ou o dono do servidor podem executar este comando.';

/**
 * Verifica permissão e responde automaticamente se negado
 * @param {Interaction} interaction - Interação do Discord
 * @param {GuildMember} member - Membro a verificar
 * @returns {Promise<boolean>} true se tem permissão, false caso contrário (já responde a interação)
 */
async function checkPermissionReply(interaction, member) {
  if (!isCriador(member, interaction?.guildId)) {
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
  MENSAGEM_PERMISSAO_NEGADA,
  checkPermissionReply,
};
