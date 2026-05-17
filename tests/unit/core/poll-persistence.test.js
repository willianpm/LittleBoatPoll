const fs = require('fs');

jest.mock('fs');
jest.mock('../../../src/utils/file-handler', () => ({
  loadJsonFile: jest.fn(),
  saveJsonFile: jest.fn(),
  ensureDataFiles: jest.fn(),
}));

jest.mock('../../../src/utils/config', () => ({
  DATA_FILES: {
    activePolls: '/data/active-polls.json',
    draftPolls: '/data/draft-polls.json',
  },
}));

const { loadJsonFile, saveJsonFile, ensureDataFiles } = require('../../../src/utils/file-handler');
const pollPersistence = require('../../../src/core/poll-persistence');

describe('poll-persistence', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      activePolls: new Map(),
      draftPolls: new Map(),
    };
    pollPersistence.attachToClient(mockClient);
  });

  describe('attachToClient', () => {
    it('expõe saveActivePolls e saveDraftPolls no client', () => {
      expect(typeof mockClient.saveActivePolls).toBe('function');
      expect(typeof mockClient.saveDraftPolls).toBe('function');
    });
  });

  describe('saveActivePolls', () => {
    it('persiste entradas do Map em activePolls', () => {
      mockClient.activePolls.set('msg-1', { titulo: 'Teste' });

      pollPersistence.saveActivePolls();

      expect(saveJsonFile).toHaveBeenCalledWith('/data/active-polls.json', [['msg-1', { titulo: 'Teste' }]]);
    });
  });

  describe('saveDraftPolls', () => {
    it('persiste valores do Map em draftPolls', () => {
      mockClient.draftPolls.set('draft-1', { id: 'draft-1', titulo: 'Rascunho' });

      pollPersistence.saveDraftPolls();

      expect(saveJsonFile).toHaveBeenCalledWith('/data/draft-polls.json', [{ id: 'draft-1', titulo: 'Rascunho' }]);
    });
  });

  describe('init', () => {
    it('garante arquivos, carrega polls e normaliza status quando existem', () => {
      fs.existsSync.mockReturnValue(true);
      loadJsonFile.mockImplementation((filePath) => {
        if (filePath.includes('active')) {
          return [['msg-1', { titulo: 'Enquete', votos: {} }]];
        }
        return [];
      });

      pollPersistence.init();

      expect(ensureDataFiles).toHaveBeenCalled();
      expect(mockClient.activePolls.size).toBe(1);
      expect(mockClient.activePolls.get('msg-1').status).toBe('ativa');
    });
  });
});
