/**
 * Emojis disponíveis para reações de enquete
 * Discord limita a 20 reações por mensagem
 */
const EMOJIS_DISPONIVEIS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];

/**
 * Cores padrão para embeds
 */
const COLORS = {
  SUCCESS: '#00FF00',
  ERROR: '#FF0000',
  WARNING: '#FFA500',
  INFO: '#4169E1',
  GOLD: '#FFD700',
  NEUTRAL: '#87CEEB',
  TIE: '#FFFF00',
};

/**
 * Limites do sistema
 */
const LIMITS = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 20,
  MIN_VOTES: 1,
  MAX_FIELD_LENGTH: 100,
};

module.exports = {
  EMOJIS_DISPONIVEIS,
  COLORS,
  LIMITS,
};
