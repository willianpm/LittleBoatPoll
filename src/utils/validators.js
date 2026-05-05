const DISCORD_CUSTOM_EMOJI_REGEX = /^<a?:[a-zA-Z0-9_]{2,32}:\d{17,20}>$/;
const DISCORD_UNICODE_EMOJI_REGEX = new RegExp(
  '^(?:\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3|\\p{Extended_Pictographic}' +
    '(?:\\uFE0F|\\uFE0E)?(?:\\p{Emoji_Modifier})?' +
    '(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?(?:\\p{Emoji_Modifier})?)*)$',
  'u',
);
const OPTIONS_DELIMITER = '|';

function isValidDiscordCustomEmoji(value) {
  if (typeof value !== 'string') return false;
  return DISCORD_CUSTOM_EMOJI_REGEX.test(value.trim());
}

function isValidDiscordUnicodeEmoji(value) {
  if (typeof value !== 'string') return false;
  return DISCORD_UNICODE_EMOJI_REGEX.test(value.trim());
}

function isValidDiscordEmoji(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  return isValidDiscordCustomEmoji(value) || isValidDiscordUnicodeEmoji(value);
}

function hasInvalidOptionsDelimiter(opcoesInput) {
  if (typeof opcoesInput !== 'string') return false;

  const input = opcoesInput.trim();
  if (!input || input.startsWith('[')) return false;

  return input.includes(',') && !input.includes(OPTIONS_DELIMITER);
}

function getInvalidOptionsDelimiterError() {
  return 'Use o caractere "|" para separar as opções. A vírgula não é mais suportada como delimitador.';
}

function parseOptionsInput(opcoesInput) {
  if (Array.isArray(opcoesInput)) {
    return opcoesInput;
  }

  if (typeof opcoesInput !== 'string') {
    return [];
  }

  const input = opcoesInput.trim();
  if (!input) return [];

  if (input.startsWith('[')) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  return parseOptions(input);
}

function normalizeOption(option) {
  if (typeof option === 'string') {
    const text = option.trim();
    if (!text) return null;
    return { text, emoji: null };
  }

  if (!option || typeof option !== 'object') {
    return null;
  }

  const text = typeof option.text === 'string' ? option.text.trim() : '';
  const emoji = typeof option.emoji === 'string' ? option.emoji.trim() : null;

  if (!text) return null;
  return { text, emoji: emoji || null };
}

/**
 * Valida opções de enquete
 * @param {Array<string|{text:string, emoji?:string|null}>} opcoes - Array de opções
 * @param {number} maxVotos - Número máximo de votos
 * @param {{ requireEmoji?: boolean }} options - Regras adicionais
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePollOptions(opcoes, maxVotos, options = {}) {
  const { requireEmoji = false } = options;

  if (!Array.isArray(opcoes) || opcoes.length === 0) {
    return { valid: false, error: 'Nenhuma opção fornecida.' };
  }

  const normalizedOptions = opcoes.map((option) => normalizeOption(option)).filter(Boolean);

  if (normalizedOptions.length === 0) {
    return { valid: false, error: 'Nenhuma opção válida foi fornecida.' };
  }

  if (normalizedOptions.length < 2) {
    return { valid: false, error: 'A enquete precisa ter pelo menos 2 opções.' };
  }

  if (normalizedOptions.length > 20) {
    return { valid: false, error: 'O Discord limita a 20 reações por mensagem. Máximo: 20 opções por enquete.' };
  }

  for (let index = 0; index < normalizedOptions.length; index++) {
    const option = normalizedOptions[index];

    if (requireEmoji && !option.emoji) {
      return {
        valid: false,
        error: `A opção ${index + 1} precisa de um emoji válido.`,
      };
    }

    if (option.emoji && !isValidDiscordEmoji(option.emoji)) {
      return {
        valid: false,
        error: `Emoji inválido na opção ${index + 1}. Use emoji Unicode do Discord ou customizado (<:nome:id>/<a:nome:id>).`,
      };
    }
  }

  if (!Number.isInteger(maxVotos) || maxVotos < 1) {
    return { valid: false, error: 'O número máximo de votos deve ser um número inteiro positivo.' };
  }

  if (maxVotos > normalizedOptions.length) {
    return {
      valid: false,
      error:
        `O número máximo de votos (${maxVotos}) não pode ser maior ` +
        `que o número de opções (${normalizedOptions.length}).`,
    };
  }

  return { valid: true, normalizedOptions };
}

/**
 * Processa e limpa string de opções (separa por pipe)
 * @param {string} opcoesString - String com opções separadas por pipe
 * @returns {Array<string>} Array de opções limpas
 */
function parseOptions(opcoesString) {
  if (!opcoesString || typeof opcoesString !== 'string') {
    return [];
  }

  return opcoesString
    .split(OPTIONS_DELIMITER)
    .map((op) => op.trim())
    .filter((op) => op.length > 0);
}

module.exports = {
  validatePollOptions,
  parseOptions,
  parseOptionsInput,
  hasInvalidOptionsDelimiter,
  getInvalidOptionsDelimiterError,
  isValidDiscordCustomEmoji,
  isValidDiscordUnicodeEmoji,
  isValidDiscordEmoji,
};
