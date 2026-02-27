const fs = require('fs');

/**
 * SISTEMA DE PERMISSÕES BINÁRIO
 *
 * O bot opera com um modelo de permissões binário:
 * - CRIADOR DE ENQUETES: Usuários com o cargo "Criador de Enquetes" têm acesso total a todas as funcionalidades
 * - USUÁRIO COMUM: Usuários sem o cargo "Criador de Enquetes" podem apenas votar em enquetes ativas
 *
 * Não há níveis intermediários, hierarquias ou permissões parciais.
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

  // Carrega os cargos Criador de Enquetes do arquivo
  let cargosCriadores = [];
  if (fs.existsSync('./cargos-criadores.json')) {
    try {
      const data = JSON.parse(fs.readFileSync('./cargos-criadores.json', 'utf8'));
      cargosCriadores = data.cargos || [];
    } catch (error) {
      console.error('❌ Erro ao ler cargos-criadores.json:', error);
      return false;
    }
  }

  // Verifica se o usuário tem algum cargo Criador de Enquetes
  return member.roles.cache.some((role) => cargosCriadores.includes(role.id));
}

/**
 * Mensagem padrão de permissão negada
 */
const MENSAGEM_PERMISSAO_NEGADA = '❌ **Permissão negada!** Apenas usuários com o cargo "Criador de Enquetes", Administradores ou o dono do servidor podem executar este comando.';

module.exports = {
  isCriador,
  MENSAGEM_PERMISSAO_NEGADA,
};
