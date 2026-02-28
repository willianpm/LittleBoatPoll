const { MessageFlags } = require('discord.js');
const { loadCriadores } = require('./file-handler');

/**
 * SISTEMA DE PERMISSÕES BINÁRIO - VERSÃO INTERNA
 *
 * O bot opera com um modelo de permissões binário INTERNO:
 * - CRIADOR DE ENQUETES: Usuários adicionados internamente no arquivo criadores-internos.json
 * - USUÁRIO COMUM: Usuários não cadastrados podem apenas votar em enquetes ativas
 *
 * Administradores do Discord e dono do servidor também têm acesso total automaticamente.
 *
 * ⚠️ MUDANÇA IMPORTANTE: As permissões administrativas não dependem de cargos do Discord.
 * O gerenciamento de criadores é 100% interno. (Mensalistas podem usar vínculo opcional por cargo no módulo de votação.)
 */

/**
 * Verifica se um usuário possui acesso total (Criador de Enquetes/Admin/Dono do servidor)
 * @param {GuildMember} member - O membro do servidor a verificar
 * @returns {boolean} true se o usuário possui acesso total, false caso contrário
 */
function isCriador(member) {
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
  return criadores.includes(member.id);
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
  MENSAGEM_PERMISSAO_NEGADA,
  checkPermissionReply,
};
