const { EMOJIS_DISPONIVEIS, COLORS, LIMITS } = require('../../../src/utils/constants');

describe('constants - EMOJIS_DISPONIVEIS', () => {
  test('deve conter exatamente 20 emojis', () => {
    expect(EMOJIS_DISPONIVEIS).toHaveLength(20);
  });

  test('deve começar com emoji A e terminar com emoji T', () => {
    expect(EMOJIS_DISPONIVEIS[0]).toBe('🇦');
    expect(EMOJIS_DISPONIVEIS[19]).toBe('🇹');
  });

  test('não deve ter emojis duplicados', () => {
    const unique = new Set(EMOJIS_DISPONIVEIS);
    expect(unique.size).toBe(EMOJIS_DISPONIVEIS.length);
  });

  test('todos os elementos devem ser strings não vazias', () => {
    EMOJIS_DISPONIVEIS.forEach((emoji) => {
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });
  });

  test('deve incluir emojis de A a T', () => {
    expect(EMOJIS_DISPONIVEIS).toContain('🇦');
    expect(EMOJIS_DISPONIVEIS).toContain('🇧');
    expect(EMOJIS_DISPONIVEIS).toContain('🇨');
    expect(EMOJIS_DISPONIVEIS).toContain('🇹');
  });
});

describe('constants - COLORS', () => {
  test('deve conter todas as cores esperadas', () => {
    expect(COLORS).toHaveProperty('SUCCESS');
    expect(COLORS).toHaveProperty('ERROR');
    expect(COLORS).toHaveProperty('WARNING');
    expect(COLORS).toHaveProperty('INFO');
    expect(COLORS).toHaveProperty('GOLD');
    expect(COLORS).toHaveProperty('NEUTRAL');
    expect(COLORS).toHaveProperty('TIE');
  });

  test('todas as cores devem ser strings hexadecimais válidas', () => {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    Object.values(COLORS).forEach((color) => {
      expect(typeof color).toBe('string');
      expect(color).toMatch(hexColorRegex);
    });
  });

  test('SUCCESS deve ser verde', () => {
    expect(COLORS.SUCCESS).toBe('#00FF00');
  });

  test('ERROR deve ser vermelho', () => {
    expect(COLORS.ERROR).toBe('#FF0000');
  });

  test('WARNING deve ser laranja', () => {
    expect(COLORS.WARNING).toBe('#FFA500');
  });

  test('não deve ter cores duplicadas críticas', () => {
    expect(COLORS.SUCCESS).not.toBe(COLORS.ERROR);
    expect(COLORS.SUCCESS).not.toBe(COLORS.WARNING);
    expect(COLORS.ERROR).not.toBe(COLORS.WARNING);
  });
});

describe('constants - LIMITS', () => {
  test('deve conter todos os limites esperados', () => {
    expect(LIMITS).toHaveProperty('MIN_OPTIONS');
    expect(LIMITS).toHaveProperty('MAX_OPTIONS');
    expect(LIMITS).toHaveProperty('MIN_VOTES');
    expect(LIMITS).toHaveProperty('MAX_FIELD_LENGTH');
  });

  test('todos os limites devem ser números inteiros positivos', () => {
    Object.values(LIMITS).forEach((limit) => {
      expect(typeof limit).toBe('number');
      expect(Number.isInteger(limit)).toBe(true);
      expect(limit).toBeGreaterThan(0);
    });
  });

  test('MIN_OPTIONS deve ser 2', () => {
    expect(LIMITS.MIN_OPTIONS).toBe(2);
  });

  test('MAX_OPTIONS deve ser 20 (limite do Discord)', () => {
    expect(LIMITS.MAX_OPTIONS).toBe(20);
  });

  test('MIN_VOTES deve ser 1', () => {
    expect(LIMITS.MIN_VOTES).toBe(1);
  });

  test('MAX_FIELD_LENGTH deve ser 100', () => {
    expect(LIMITS.MAX_FIELD_LENGTH).toBe(100);
  });

  test('MIN_OPTIONS deve ser menor que MAX_OPTIONS', () => {
    expect(LIMITS.MIN_OPTIONS).toBeLessThan(LIMITS.MAX_OPTIONS);
  });

  test('MAX_OPTIONS deve corresponder ao tamanho de EMOJIS_DISPONIVEIS', () => {
    expect(LIMITS.MAX_OPTIONS).toBe(EMOJIS_DISPONIVEIS.length);
  });
});

describe('constants - Integração entre constantes', () => {
  test('MAX_OPTIONS deve ser igual ao número de emojis disponíveis', () => {
    expect(LIMITS.MAX_OPTIONS).toBe(EMOJIS_DISPONIVEIS.length);
  });

  test('deve ter pelo menos MIN_OPTIONS emojis disponíveis', () => {
    expect(EMOJIS_DISPONIVEIS.length).toBeGreaterThanOrEqual(LIMITS.MIN_OPTIONS);
  });
});
