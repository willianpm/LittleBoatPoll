import { validatePollFormOptions, normalizePollFormOptions } from './poll-option-validation';

describe('poll-option-validation', () => {
  const serverEmojis = [
    {
      id: '123456789012345678',
      name: 'livro',
      identifier: '<:livro:123456789012345678>',
      animated: false,
    },
  ];

  it('normaliza opções removendo linhas vazias', () => {
    const normalized = normalizePollFormOptions([
      { id: '1', text: '  Opção A  ', emoji: '😀' },
      { id: '2', text: '   ', emoji: '   ' },
    ]);

    expect(normalized).toEqual([{ id: '1', text: 'Opção A', emoji: '😀' }]);
  });

  it('aceita opções válidas com emoji unicode e custom do servidor', () => {
    const result = validatePollFormOptions(
      [
        { id: '1', text: 'A', emoji: '😀' },
        { id: '2', text: 'B', emoji: '<:livro:123456789012345678>' },
      ],
      serverEmojis,
    );

    expect(result.hasErrors).toBe(false);
    expect(result.normalizedOptions).toHaveLength(2);
  });

  it('rejeita emoji custom que não pertence ao servidor', () => {
    const result = validatePollFormOptions(
      [
        { id: '1', text: 'A', emoji: '😀' },
        { id: '2', text: 'B', emoji: '<:outro:999999999999999999>' },
      ],
      serverEmojis,
    );

    expect(result.hasErrors).toBe(true);
    expect(result.errors['2']).toContain('lista do servidor');
  });

  it('exige texto e emoji em cada opção preenchida', () => {
    const result = validatePollFormOptions([{ id: '1', text: '', emoji: '😀' }], serverEmojis);

    expect(result.hasErrors).toBe(true);
    expect(result.errors['1']).toContain('texto');
  });
});
