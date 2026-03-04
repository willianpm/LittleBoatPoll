// Testes unitários para csvService
const { parseAndValidate } = require('./csvService');
const fs = require('fs/promises');
const path = require('path');

describe('csvService.parseAndValidate', () => {
  const testCsvPath = path.resolve(__dirname, 'test.csv');

  beforeAll(async () => {
    // Cria um arquivo CSV de teste
    await fs.writeFile(testCsvPath, 'id,name\n1,Ana\n2,João', 'utf-8');
  });

  afterAll(async () => {
    // Remove o arquivo de teste
    await fs.unlink(testCsvPath);
  });

  it('deve converter CSV válido para JSON', async () => {
    const result = await parseAndValidate(testCsvPath);
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(2);
    expect(result.data[0]).toEqual({ id: '1', name: 'Ana' });
  });

  it('deve retornar erro para CSV vazio', async () => {
    const emptyCsvPath = path.resolve(__dirname, 'empty.csv');
    await fs.writeFile(emptyCsvPath, '', 'utf-8');
    const result = await parseAndValidate(emptyCsvPath);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Arquivo CSV vazio.');
    await fs.unlink(emptyCsvPath);
  });
});
