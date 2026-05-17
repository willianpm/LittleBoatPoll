const { getReactionEmojiKey, normalizePollMaxVotos } = require('../../../src/core/reaction-handler');

jest.mock('../../../src/core/poll-persistence', () => ({
  saveActivePolls: jest.fn(),
}));

jest.mock('../../../src/core/mensalista-runtime', () => ({
  isUserMensalista: jest.fn(),
}));

jest.mock('../../../src/utils/config', () => ({
  DEBUG_MODE: false,
}));

describe('reaction-handler', () => {
  describe('getReactionEmojiKey', () => {
    it('retorna null quando não há emoji', () => {
      expect(getReactionEmojiKey({})).toBeNull();
      expect(getReactionEmojiKey(null)).toBeNull();
    });

    it('retorna nome unicode para emoji padrão', () => {
      expect(getReactionEmojiKey({ emoji: { name: '📚' } })).toBe('📚');
    });

    it('retorna formato customizado para emoji do servidor', () => {
      const reaction = {
        emoji: { id: '123', name: 'book', animated: false },
      };
      expect(getReactionEmojiKey(reaction)).toBe('<:book:123>');
    });

    it('retorna formato animado para emoji animado', () => {
      const reaction = {
        emoji: { id: '456', name: 'spin', animated: true },
      };
      expect(getReactionEmojiKey(reaction)).toBe('<a:spin:456>');
    });
  });

  describe('normalizePollMaxVotos', () => {
    it('corrige maxVotos inválido para 1', () => {
      const poll = { maxVotos: 0 };
      const result = normalizePollMaxVotos(poll);

      expect(result.maxVotosValido).toBe(1);
      expect(result.changed).toBe(true);
      expect(poll.maxVotos).toBe(1);
    });

    it('mantém maxVotos válido sem alteração', () => {
      const poll = { maxVotos: 3 };
      const result = normalizePollMaxVotos(poll);

      expect(result.maxVotosValido).toBe(3);
      expect(result.changed).toBe(false);
    });
  });
});
