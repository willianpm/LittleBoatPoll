// Testes unitários para csvService
const { parseAndValidate } = require('./csvService');
const fs = require('fs/promises');
const path = require('path');

describe('csvService.parseAndValidate', () => {
  const createdFiles = new Set();

  async function writeCsvFile(fileName, content) {
    const filePath = path.resolve(__dirname, fileName);
    await fs.writeFile(filePath, content, 'utf-8');
    createdFiles.add(filePath);
    return filePath;
  }

  afterEach(async () => {
    for (const filePath of createdFiles) {
      await fs.unlink(filePath).catch(() => {});
    }
    createdFiles.clear();
  });

  it('deve converter CSV válido para JSON', async () => {
    const testCsvPath = await writeCsvFile(
      'test.csv',
      [
        'nome-da-enquete;opções;max_votos;peso_mensalistas',
        'Enquete 1;Opção A,Opção B;2;sim',
        'Enquete 2;Opção X,Opção Y,Opção Z;1;nao',
      ].join('\n'),
    );

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
    const emptyCsvPath = await writeCsvFile('empty.csv', '');

    const result = await parseAndValidate(emptyCsvPath);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Arquivo CSV vazio.');
  });

  it('deve retornar erro quando colunas obrigatórias estiverem incorretas', async () => {
    const invalidHeaderPath = await writeCsvFile(
      'invalid-header.csv',
      ['nome-da-enquete;opções;max_votos', 'Enquete 1;A,B;1'].join('\n'),
    );

    const result = await parseAndValidate(invalidHeaderPath);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('CSV deve conter exatamente 4 colunas');
  });

  it('deve retornar erro quando uma linha não tiver campos obrigatórios', async () => {
    const missingFieldPath = await writeCsvFile(
      'missing-fields.csv',
      ['nome-da-enquete;opções;max_votos;peso_mensalistas', 'Enquete 1;;2;sim'].join('\n'),
    );

    const result = await parseAndValidate(missingFieldPath);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Linha 2: campos obrigatórios ausentes.');
  });

  it('deve retornar erro quando o CSV tem formato inválido para parsing', async () => {
    const malformedCsvPath = await writeCsvFile('malformed.csv', '"nome-da-enquete;opções;max_votos;peso_mensalistas');

    const result = await parseAndValidate(malformedCsvPath);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Erro ao ler o CSV: formato inválido ou delimitador incorreto.');
  });

  it('deve retornar erro por linha quando max_votos for inválido', async () => {
    const invalidVotesPath = await writeCsvFile(
      'invalid-votes.csv',
      ['nome-da-enquete;opções;max_votos;peso_mensalistas', 'Enquete 1;A,B;abc;sim'].join('\n'),
    );

    const result = await parseAndValidate(invalidVotesPath);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Linha 2:');
    expect(result.error).toContain('número inteiro positivo');
  });
});
