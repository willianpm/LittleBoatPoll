const {
  formatValidationError,
  formatDraftNotFound,
  buildActivePollEmbed,
  embedWithMessageId,
  buildDraftCreatedEmbed,
  buildMensalistaToggleEmbed,
  buildPollOptionsDescription,
} = require('../../../src/utils/response-builders');
const { COLORS } = require('../../../src/utils/constants');

describe('response-builders', () => {
  describe('formatValidationError', () => {
    it('prefixa mensagem com indicador de erro', () => {
      expect(formatValidationError('opção inválida')).toBe('❌ **Erro!** opção inválida');
    });
  });

  describe('formatDraftNotFound', () => {
    it('inclui o ID do rascunho na mensagem', () => {
      expect(formatDraftNotFound('ABC123')).toContain('ABC123');
    });
  });

  describe('buildPollOptionsDescription', () => {
    it('lista opções com emojis e limite de votos', () => {
      const descricao = buildPollOptionsDescription(['Livro A', 'Livro B'], ['🇦', '🇧'], 2);
      expect(descricao).toContain('Selecione até 2 opções');
      expect(descricao).toContain('🇦 Livro A');
    });
  });

  describe('buildActivePollEmbed', () => {
    it('cria embed com cor e regras da enquete', () => {
      const embed = buildActivePollEmbed({
        titulo: 'Enquete Teste',
        opcoes: ['A', 'B'],
        emojiNumeros: ['🇦', '🇧'],
        maxVotos: 1,
        usarPesoMensalista: true,
      });

      const data = embed.toJSON();
      expect(data.color).toBe(parseInt(COLORS.GOLD.replace('#', ''), 16));
      expect(data.title).toContain('Enquete Teste');
      expect(data.fields.some((field) => field.name === 'Regras 📊')).toBe(true);
    });
  });

  describe('embedWithMessageId', () => {
    it('adiciona campo ID à mensagem', () => {
      const base = buildActivePollEmbed({
        titulo: 'T',
        opcoes: ['A'],
        emojiNumeros: ['🇦'],
        maxVotos: 1,
        usarPesoMensalista: false,
      });
      const withId = embedWithMessageId(base, 'msg-999');
      expect(withId.toJSON().fields.some((field) => field.name === 'ID' && field.value === 'msg-999')).toBe(true);
    });
  });

  describe('buildDraftCreatedEmbed', () => {
    it('inclui ID e duração do rascunho', () => {
      const embed = buildDraftCreatedEmbed({
        draftId: 'DRAFT1',
        titulo: 'Título',
        opcoesInline: 'A, B',
        maxVotos: 2,
        usarPesoMensalista: false,
        durationLabel: '24 horas',
      });

      const data = embed.toJSON();
      expect(data.title).toContain('Rascunho Criado');
      expect(data.fields.some((field) => field.value.includes('DRAFT1'))).toBe(true);
    });
  });

  describe('buildMensalistaToggleEmbed', () => {
    it('diferencia embed de adição e remoção', () => {
      const added = buildMensalistaToggleEmbed({ username: 'user', added: true }).toJSON();
      const removed = buildMensalistaToggleEmbed({ username: 'user', added: false }).toJSON();

      expect(added.title).toContain('ADICIONADO');
      expect(removed.title).toContain('REMOVIDO');
    });
  });
});
