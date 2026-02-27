const { validatePollOptions, parseOptions, validatePesoMensalista } = require('../utils/validators');

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
});

describe('validators - parseOptions', () => {
  test('deve parsear string com opções válidas', () => {
    const result = parseOptions('Opção 1, Opção 2, Opção 3');
    expect(result).toEqual(['Opção 1', 'Opção 2', 'Opção 3']);
  });

  test('deve remover espaços em branco extras', () => {
    const result = parseOptions('  A  ,  B  ,  C  ');
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('deve filtrar opções vazias', () => {
    const result = parseOptions('A, , B, ,C');
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

  test('deve lidar com opções com vírgulas no texto', () => {
    const result = parseOptions('Livro A, Livro B');
    expect(result).toHaveLength(2);
  });
});

describe('validators - validatePesoMensalista', () => {
  test('deve validar "sim" como válido', () => {
    expect(validatePesoMensalista('sim')).toBe(true);
  });

  test('deve validar "nao" como válido', () => {
    expect(validatePesoMensalista('nao')).toBe(true);
  });

  test('deve rejeitar "yes"', () => {
    expect(validatePesoMensalista('yes')).toBe(false);
  });

  test('deve rejeitar string vazia', () => {
    expect(validatePesoMensalista('')).toBe(false);
  });

  test('deve rejeitar valores diferentes', () => {
    expect(validatePesoMensalista('true')).toBe(false);
    expect(validatePesoMensalista('false')).toBe(false);
    expect(validatePesoMensalista('Sim')).toBe(false); // case sensitive
  });
});
