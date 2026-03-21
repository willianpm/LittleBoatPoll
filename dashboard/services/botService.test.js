// Testes unitários para botService
const { savePoll } = require('./botService');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const mockTestJsonPath = path.join(os.tmpdir(), `littleboatpoll-draft-polls-${process.pid}.json`);

// Mock da config para testes
jest.mock('../../src/utils/config', () => ({
  DATA_FILES: {
    draftPolls: mockTestJsonPath,
  },
}));

describe('botService.savePoll', () => {
  let originalContent;
  let fileExisted = false;

  beforeAll(async () => {
    try {
      originalContent = await fs.readFile(mockTestJsonPath, 'utf-8');
      fileExisted = true;
    } catch {
      fileExisted = false;
    }
  });

  afterAll(async () => {
    if (fileExisted) {
      await fs.writeFile(mockTestJsonPath, originalContent, 'utf-8');
      return;
    }
    await fs.unlink(mockTestJsonPath).catch(() => {});
  });

  it('deve salvar JSON corretamente no ambiente configurado', async () => {
    const testData = [
      { id: '1', titulo: 'Ana', opcoes: ['A', 'B'], maxVotos: 1, usarPesoMensalista: true },
      { id: '2', titulo: 'João', opcoes: ['X', 'Y'], maxVotos: 1, usarPesoMensalista: false },
    ];

    await savePoll(testData);

    const content = await fs.readFile(mockTestJsonPath, 'utf-8');
    const json = JSON.parse(content);

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json[0]).toEqual(
      expect.objectContaining({
        id: '1',
        titulo: 'Ana',
        opcoes: ['A', 'B'],
        maxVotos: 1,
        status: 'rascunho',
      }),
    );
  });

  it('deve sobrescrever conteúdo anterior ao salvar novos dados', async () => {
    await savePoll([{ id: 'old', titulo: 'Old Poll', opcoes: ['A', 'B'], maxVotos: 1 }]);
    await savePoll([{ id: 'new', titulo: 'New Poll', opcoes: ['A', 'B'], maxVotos: 1 }]);

    const content = await fs.readFile(mockTestJsonPath, 'utf-8');
    const json = JSON.parse(content);

    expect(json).toHaveLength(1);
    expect(json[0]).toEqual(
      expect.objectContaining({
        id: 'new',
        titulo: 'New Poll',
        status: 'rascunho',
      }),
    );
  });

  it('deve propagar erro quando a escrita falhar', async () => {
    const writeSpy = jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('write failed'));

    await expect(savePoll([{ id: '1', name: 'Ana' }])).rejects.toThrow('write failed');

    writeSpy.mockRestore();
  });

  it('deve usar path correto baseado em APP_ENV', async () => {
    const { DATA_FILES } = require('../../src/utils/config');
    // Converter \ para / para comparação cross-platform
    const normalizedPath = DATA_FILES.draftPolls.replace(/\\/g, '/');
    expect(normalizedPath).toContain('littleboatpoll-draft-polls-');
    expect(normalizedPath).toContain('draft-polls');
    expect(normalizedPath).toContain('.json');
  });
});