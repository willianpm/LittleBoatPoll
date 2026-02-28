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

  if (!Array.isArray(roleIds)) {
    return [];
  }

  return [...new Set(roleIds.map((roleId) => extractSnowflake(roleId)).filter(Boolean))];
}

/**
 * Verifica se o membro possui ao menos um cargo autorizado para acesso administrativo
 * @param {GuildMember} member - Membro do servidor
 * @returns {boolean} true se possui cargo autorizado
 */
function hasAuthorizedAdminRole(member, guildIdOverride) {
  const guildId = resolveGuildId(member, guildIdOverride);
  const authorizedRoleIds = getAuthorizedAdminRoleIds(guildId);

  console.log('🔍 [ROLE CHECK] Verificando cargos autorizados...');
  console.log('   Guild ID:', guildId);
  console.log('   Cargos autorizados para esta guild:', authorizedRoleIds);

  if (!authorizedRoleIds.length) {
    console.log('⚠️ [ROLE CHECK] Nenhum cargo autorizado configurado para esta guild');
    return false;
  }

  const memberId = getMemberId(member);
  const memberRoleIds = getMemberRoleIds(member);

  console.log('   Cargos do usuário:', memberRoleIds);

  if (!memberRoleIds.length) {
    console.log(`⚠️ [ROLE CHECK] Membro ${memberId || 'desconhecido'} sem cargos carregados`);
    return false;
  }

  const memberRoleIdSet = new Set(memberRoleIds);
  const hasRole = authorizedRoleIds.some((roleId) => memberRoleIdSet.has(roleId));
  
  if (hasRole) {
    const matchingRoles = authorizedRoleIds.filter((roleId) => memberRoleIdSet.has(roleId));
    console.log(`✅ [ROLE CHECK] Membro tem cargo autorizado:`, matchingRoles);
  } else {
    console.log(`❌ [ROLE CHECK] Membro ${memberId || 'desconhecido'} não tem cargo autorizado.`);
    console.log(`   Esperado: ${authorizedRoleIds.join(', ')}`);
    console.log(`   Possui: ${memberRoleIds.join(', ')}`);
  }

  return hasRole;
}

/**
 * Verifica se um usuário possui acesso total (Criador de Enquetes/Admin/Dono do servidor)
 * @param {GuildMember} member - O membro do servidor a verificar
 * @returns {boolean} true se o usuário possui acesso total, false caso contrário
 */
function isCriador(member, guildIdOverride) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [PERMISSION CHECK] isCriador iniciado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!member) {
    console.log('❌ [PERMISSION] member é null/undefined');
    return false;
  }

  const memberId = getMemberId(member);
  const memberTag = member.user?.tag || member.user?.username || 'Desconhecido';
  
  console.log('👤 Usuário:', memberTag);
  console.log('🆔 User ID:', memberId);
  console.log('🏰 Guild ID:', member.guild?.id || guildIdOverride);

  // Administrador ou dono do servidor tem acesso total
  if (hasAdministratorPermission(member)) {
    console.log('✅ [PERMISSION] Usuário é ADMINISTRADOR do Discord');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  if (member.guild?.ownerId && memberId && memberId === member.guild.ownerId) {
    console.log('✅ [PERMISSION] Usuário é DONO DO SERVIDOR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  // Carrega os criadores internos do arquivo (via file-handler)
  const criadoresData = loadCriadores();
  const criadores = criadoresData.criadores || [];
  
  console.log('📋 Lista de Criadores Internos:', criadores);
  console.log('🔍 Verificando se', memberId, 'está na lista...');

  // Verifica se o ID do usuário está na lista interna de criadores
  if (memberId && criadores.includes(memberId)) {
    console.log('✅ [PERMISSION] Usuário está na lista de CRIADORES INTERNOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  } else {
    console.log('⚠️ [PERMISSION] Usuário NÃO está na lista de criadores internos');
  }

  // Verifica cargos autorizados
  const hasRole = hasAuthorizedAdminRole(member, guildIdOverride);
  
  if (hasRole) {
    console.log('✅ [PERMISSION] Usuário tem CARGO AUTORIZADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('❌ [PERMISSION] PERMISSÃO NEGADA - Usuário não atende nenhum critério');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  return hasRole;
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
  getAuthorizedAdminRoleIds,
  hasAuthorizedAdminRole,
  MENSAGEM_PERMISSAO_NEGADA,
  checkPermissionReply,
};
