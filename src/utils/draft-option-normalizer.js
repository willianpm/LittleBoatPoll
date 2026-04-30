/**
 * Módulo de normalização de opções de rascunho
 * Fornece funções defensivas para trabalhar com opções em ambos formatos:
 * - Antigo (string): 'Opção A'
 * - Novo (objeto): { text: 'Opção A', emoji: '😀' }
 */

/**
 * Normaliza uma opção de rascunho para formato objeto { text, emoji }
 * Compatível com strings antigas e objetos novos
 * @param {string | object} option - Opção no formato antigo ou novo
 * @returns {object | null} Objeto normalizado { text, emoji } ou null se inválido
 */
function normalizeDraftOption(option) {
  // Caso 1: String antiga (compatibilidade retroativa)
  if (typeof option === 'string') {
    const text = option.trim();
    if (!text) return null;
    return { text, emoji: null };
  }

  // Caso 2: Já é um objeto
  if (!option || typeof option !== 'object') {
    return null;
  }

  const text = typeof option.text === 'string' ? option.text.trim() : '';
  const emoji = typeof option.emoji === 'string' ? option.emoji.trim() : null;

  if (!text) return null;
  return { text, emoji: emoji || null };
}

/**
 * Normaliza array de opções para formato padrão { text, emoji }[]
 * @param {array} options - Array de opções em formato misto ou homogêneo
 * @returns {array} Array de objetos normalizados { text, emoji }[]
 */
function normalizeDraftOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((option) => normalizeDraftOption(option)).filter(Boolean);
}

/**
 * Extrai texto de uma opção (compatível com ambos formatos)
 * Uso: Para operações string-based como .toLowerCase(), comparações, etc
 * @param {string | object} option - Opção no formato antigo ou novo
 * @returns {string} Texto da opção ou string vazia
 */
function draftOptionText(option) {
  return normalizeDraftOption(option)?.text || '';
}

module.exports = {
  normalizeDraftOption,
  normalizeDraftOptions,
  draftOptionText,
};
