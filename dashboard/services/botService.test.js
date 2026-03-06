// Testes unitários para botService
const { savePoll } = require('./botService');
const fs = require('fs/promises');
const path = require('path');

describe('botService.savePoll', () => {
  const testJsonPath = path.resolve(__dirname, '../../data/environments/staging/draft-polls.json');
  let originalContent;
  let fileExisted = false;

  beforeAll(async () => {
    try {
      originalContent = await fs.readFile(testJsonPath, 'utf-8');
      fileExisted = true;
    } catch {
      fileExisted = false;
    }
  });

  afterAll(async () => {
    if (fileExisted) {
      await fs.writeFile(testJsonPath, originalContent, 'utf-8');
      return;
    }
    await fs.unlink(testJsonPath).catch(() => {});
  });

  it('deve salvar JSON corretamente', async () => {
    const testData = [
      { id: '1', name: 'Ana' },
      { id: '2', name: 'João' },
    ];

    await savePoll(testData);

    const content = await fs.readFile(testJsonPath, 'utf-8');
    const json = JSON.parse(content);

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json[0]).toEqual({ id: '1', name: 'Ana' });
  });

  it('deve sobrescrever conteúdo anterior ao salvar novos dados', async () => {
    await savePoll([{ id: 'old', name: 'Old Poll' }]);
    await savePoll([{ id: 'new', name: 'New Poll' }]);

    const content = await fs.readFile(testJsonPath, 'utf-8');
    const json = JSON.parse(content);

    expect(json).toEqual([{ id: 'new', name: 'New Poll' }]);
  });

  it('deve propagar erro quando a escrita falhar', async () => {
    const writeSpy = jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('write failed'));

    await expect(savePoll([{ id: '1', name: 'Ana' }])).rejects.toThrow('write failed');

    writeSpy.mockRestore();
  });
});
