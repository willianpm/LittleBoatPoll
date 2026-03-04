// Testes unitários para csvService
const { parseAndValidate } = require('./csvService');
const fs = require('fs/promises');
const path = require('path');

describe('csvService.parseAndValidate', () => {
  const testCsvPath = path.resolve(__dirname, 'test.csv');

  beforeAll(async () => {
    // Cria um arquivo CSV de teste com colunas obrigatórias
    const csvContent = [
      'nome-da-enquete;opções;max_votos;peso_mensalistas',
      'Enquete 1;Opção A,Opção B;2;sim',
      'Enquete 2;Opção X,Opção Y,Opção Z;1;nao',
    ].join('\n');
    await fs.writeFile(testCsvPath, csvContent, 'utf-8');
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
    expect(result.data[0].titulo).toBe('Enquete 1');
    expect(result.data[0].opcoes).toEqual(['Opção A', 'Opção B']);
    expect(result.data[0].maxVotos).toBe(2);
    expect(result.data[0].usarPesoMensalista).toBe(true);
    expect(result.data[1].titulo).toBe('Enquete 2');
    expect(result.data[1].opcoes).toEqual(['Opção X', 'Opção Y', 'Opção Z']);
    expect(result.data[1].maxVotos).toBe(1);
    expect(result.data[1].usarPesoMensalista).toBe(false);
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
