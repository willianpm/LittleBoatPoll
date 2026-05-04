const {
  validatePollOptions,
  parseOptions,
  parseOptionsInput,
  hasInvalidOptionsDelimiter,
  getInvalidOptionsDelimiterError,
  isValidDiscordEmoji,
} = require('../../../src/utils/validators');

describe('validators - validatePollOptions', () => {
  test('deve validar opções válidas com 2 opções', () => {
    const result = validatePollOptions(['Opção 1', 'Opção 2'], 1);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('deve validar opções válidas com maxVotos igual ao número de opções', () => {
    const result = validatePollOptions(['A', 'B', 'C'], 3);
    expect(result.valid).toBe(true);
  });

  test('deve rejeitar array vazio', () => {
    const result = validatePollOptions([], 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Nenhuma opção fornecida');
  });

  test('deve rejeitar apenas 1 opção', () => {
    const result = validatePollOptions(['Única'], 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('pelo menos 2 opções');
  });

  test('deve rejeitar mais de 20 opções', () => {
    const opcoes = Array.from({ length: 21 }, (_, i) => `Opção ${i + 1}`);
    const result = validatePollOptions(opcoes, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Máximo: 20 opções');
  });

  test('deve rejeitar maxVotos não inteiro', () => {
    const result = validatePollOptions(['A', 'B'], 1.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('inteiro positivo');
  });

  test('deve rejeitar maxVotos zero ou negativo', () => {
    const result1 = validatePollOptions(['A', 'B'], 0);
    expect(result1.valid).toBe(false);

    const result2 = validatePollOptions(['A', 'B'], -1);
    expect(result2.valid).toBe(false);
  });

  test('deve rejeitar maxVotos maior que número de opções', () => {
    const result = validatePollOptions(['A', 'B', 'C'], 5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('não pode ser maior que o número de opções');
  });

  test('deve rejeitar input não array', () => {
    const result = validatePollOptions('não é array', 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Nenhuma opção fornecida');
  });

  test('deve aceitar emoji unicode válido quando obrigatório', () => {
    const result = validatePollOptions(
      [
        { text: 'Opção A', emoji: '😀' },
        { text: 'Opção B', emoji: '📚' },
      ],
      1,
      { requireEmoji: true },
    );

    expect(result.valid).toBe(true);
  });

  test('deve aceitar emoji customizado válido do Discord', () => {
    const result = validatePollOptions(
      [
        { text: 'Opção A', emoji: '<:livro:123456789012345678>' },
        { text: 'Opção B', emoji: '<a:barco:123456789012345679>' },
      ],
      1,
      { requireEmoji: true },
    );

    expect(result.valid).toBe(true);
  });

  test('deve rejeitar emoji inválido', () => {
    const result = validatePollOptions(
      [
        { text: 'Opção A', emoji: 'nao-emoji' },
        { text: 'Opção B', emoji: '😀' },
      ],
      1,
      { requireEmoji: true },
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Emoji inválido');
  });

  test('deve rejeitar opção sem emoji quando obrigatório', () => {
    const result = validatePollOptions(
      [
        { text: 'Opção A', emoji: '' },
        { text: 'Opção B', emoji: '😀' },
      ],
      1,
      { requireEmoji: true },
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain('precisa de um emoji válido');
  });
});

describe('validators - parseOptions', () => {
  test('deve parsear string com opções válidas', () => {
    const result = parseOptions('Opção 1 | Opção 2 | Opção 3');
    expect(result).toEqual(['Opção 1', 'Opção 2', 'Opção 3']);
  });

  test('deve remover espaços em branco extras', () => {
    const result = parseOptions('  A  |  B  |  C  ');
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('deve filtrar opções vazias', () => {
    const result = parseOptions('A| |B||C');
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('deve retornar array vazio para string vazia', () => {
    const result = parseOptions('');
    expect(result).toEqual([]);
  });

  test('deve retornar array vazio para null', () => {
    const result = parseOptions(null);
    expect(result).toEqual([]);
  });

  test('deve retornar array vazio para undefined', () => {
    const result = parseOptions(undefined);
    expect(result).toEqual([]);
  });

  test('deve retornar array vazio para tipo não string', () => {
    const result = parseOptions(123);
    expect(result).toEqual([]);
  });

  test('deve preservar vírgulas dentro da opção quando usar pipe', () => {
    const result = parseOptions('O Bom, o Mau e o Feio | Clube da Luta | Interestelar');
    expect(result).toEqual(['O Bom, o Mau e o Feio', 'Clube da Luta', 'Interestelar']);
  });

  test('não deve separar por vírgula', () => {
    const result = parseOptions('Opção A, Opção B');
    expect(result).toEqual(['Opção A, Opção B']);
  });
});

describe('validators - parseOptionsInput', () => {
  test('deve parsear opções estruturadas em JSON', () => {
    const result = parseOptionsInput('[{"text":"Opção A","emoji":"😀"},{"text":"Opção B","emoji":"📚"}]');

    expect(result).toEqual([
      { text: 'Opção A', emoji: '😀' },
      { text: 'Opção B', emoji: '📚' },
    ]);
  });

  test('deve fazer fallback para parser com string separada por pipe', () => {
    const result = parseOptionsInput('Opção A | Opção B');
    expect(result).toEqual(['Opção A', 'Opção B']);
  });
});

describe('validators - hasInvalidOptionsDelimiter', () => {
  test('deve identificar uso inválido de vírgula como delimitador', () => {
    expect(hasInvalidOptionsDelimiter('A, B, C')).toBe(true);
  });

  test('não deve marcar input válido separado por pipe', () => {
    expect(hasInvalidOptionsDelimiter('A | B | C')).toBe(false);
  });

  test('não deve marcar payload JSON', () => {
    expect(hasInvalidOptionsDelimiter('[{"text":"A"},{"text":"B"}]')).toBe(false);
  });

  test('deve expor mensagem de erro padronizada', () => {
    expect(getInvalidOptionsDelimiterError()).toContain('caractere "|"');
  });
});

describe('validators - isValidDiscordEmoji', () => {
  test('valida emoji unicode', () => {
    expect(isValidDiscordEmoji('😀')).toBe(true);
  });

  test('valida emoji customizado', () => {
    expect(isValidDiscordEmoji('<:livro:123456789012345678>')).toBe(true);
    expect(isValidDiscordEmoji('<a:livro:123456789012345678>')).toBe(true);
  });

  test('rejeita valor inválido', () => {
    expect(isValidDiscordEmoji('abc')).toBe(false);
  });
});
