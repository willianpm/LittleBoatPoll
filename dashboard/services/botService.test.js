// Testes unitários para botService
const { savePoll } = require('./botService');
const fs = require('fs/promises');
const path = require('path');

describe('botService.savePoll', () => {
  const testJsonPath = path.resolve(__dirname, '../../data/environments/staging/draft-polls.json');
  const testData = [
    { id: '1', name: 'Ana' },
    { id: '2', name: 'João' },
  ];

  afterAll(async () => {
    // Remove o arquivo de teste
    await fs.unlink(testJsonPath);
  });

  it('deve salvar JSON corretamente', async () => {
    await savePoll(testData);
    const content = await fs.readFile(testJsonPath, 'utf-8');
    const json = JSON.parse(content);
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json[0]).toEqual({ id: '1', name: 'Ana' });
  });
});
