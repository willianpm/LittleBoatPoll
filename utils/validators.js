/**
 * Valida opções de enquete
 * @param {Array<string>} opcoes - Array de opções
 * @param {number} maxVotos - Número máximo de votos
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePollOptions(opcoes, maxVotos) {
  if (!Array.isArray(opcoes) || opcoes.length === 0) {
    return { valid: false, error: 'Nenhuma opção fornecida.' };
  }

  if (opcoes.length < 2) {
    return { valid: false, error: 'A enquete precisa ter pelo menos 2 opções.' };
  }

  if (opcoes.length > 20) {
    return { valid: false, error: 'O Discord limita a 20 reações por mensagem. Máximo: 20 opções por enquete.' };
  }

  if (!Number.isInteger(maxVotos) || maxVotos < 1) {
    return { valid: false, error: 'O número máximo de votos deve ser um número inteiro positivo.' };
  }

  if (maxVotos > opcoes.length) {
    return { valid: false, error: `O número máximo de votos (${maxVotos}) não pode ser maior que o número de opções (${opcoes.length}).` };
  }

  return { valid: true };
}

/**
 * Processa e limpa string de opções (separa por vírgula)
 * @param {string} opcoesString - String com opções separadas por vírgula
 * @returns {Array<string>} Array de opções limpas
 */
function parseOptions(opcoesString) {
  if (!opcoesString || typeof opcoesString !== 'string') {
    return [];
  }

  return opcoesString
    .split(',')
    .map((op) => op.trim())
    .filter((op) => op.length > 0);
}

/**
 * Valida se o peso mensalista é válido
 * @param {string} peso - Valor do peso ("sim" ou "nao")
 * @returns {boolean} true se válido
 */
function validatePesoMensalista(peso) {
  return peso === 'sim' || peso === 'nao';
}

module.exports = {
  validatePollOptions,
  parseOptions,
  validatePesoMensalista,
};
