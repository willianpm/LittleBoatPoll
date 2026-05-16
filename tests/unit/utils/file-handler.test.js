const fs = require('fs');

jest.mock('fs');
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../../src/utils/config', () => ({
  DATA_DIR: '/test-data',
  DATA_FILES: {
    mensalistas: '/test-data/mensalistas.json',
    roleBindings: '/test-data/role-bindings.json',
    criadores: '/test-data/criadores.json',
    historico: '/test-data/historico.json',
    draftPolls: '/test-data/draft-polls.json',
    activePolls: '/test-data/active-polls.json',
  },
}));

const {
  loadJsonFile,
  saveJsonFile,
  loadMensalistas,
  saveMensalistas,
  loadCriadores,
  saveCriadores,
  saveRoleBindings,
  normalizeRoleBindings,
  loadVotacoes,
  saveVotacoes,
  ensureDataFiles,
  ensureDirectoryExists,
} = require('../../../src/utils/file-handler');

describe('file-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => undefined);
    fs.writeFileSync.mockImplementation(() => undefined);
  });

  describe('loadJsonFile / saveJsonFile', () => {
    it('carrega JSON existente', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ ok: true }));

      expect(loadJsonFile('/test-data/sample.json', { fallback: 1 })).toEqual({ ok: true });
    });

    it('retorna valor padrão quando arquivo não existe', () => {
      expect(loadJsonFile('/test-data/missing.json', { fallback: 1 })).toEqual({ fallback: 1 });
    });

    it('retorna valor padrão quando JSON é inválido', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{ invalid');

      expect(loadJsonFile('/test-data/broken.json', [])).toEqual([]);
    });

    it('salva JSON com sucesso', () => {
      const result = saveJsonFile('/test-data/out.json', { saved: true });

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith('/test-data/out.json', JSON.stringify({ saved: true }, null, 2));
    });

    it('retorna false quando gravação falha', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('write failed');
      });

      expect(saveJsonFile('/test-data/out.json', { saved: true })).toBe(false);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('cria diretório quando ausente', () => {
      fs.existsSync.mockReturnValue(false);

      ensureDirectoryExists('/test-data/nested');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/test-data/nested', { recursive: true });
    });
  });

  describe('loadMensalistas / saveMensalistas', () => {
    it('normaliza entradas legadas em string e objeto', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          mensalistas: ['user-legacy', { id: 'user-object', addedAt: '2026-01-01T00:00:00.000Z', addedBy: 'admin-1' }],
        }),
      );

      const result = loadMensalistas();

      expect(result.mensalistas).toEqual([
        { id: 'user-legacy', addedAt: null, addedBy: null },
        { id: 'user-object', addedAt: '2026-01-01T00:00:00.000Z', addedBy: 'admin-1' },
      ]);
    });

    it('persiste lista normalizada de mensalistas', () => {
      const saved = saveMensalistas({
        mensalistas: [{ id: 'user-1', addedAt: '2026-01-02T00:00:00.000Z', addedBy: 'admin-2' }],
      });

      expect(saved).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test-data/mensalistas.json',
        JSON.stringify(
          {
            mensalistas: [{ id: 'user-1', addedAt: '2026-01-02T00:00:00.000Z', addedBy: 'admin-2' }],
          },
          null,
          2,
        ),
      );
    });
  });

  describe('loadCriadores / saveCriadores', () => {
    it('normaliza criadores com aliases de campo', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          criadores: [{ userId: 'creator-1', criadoEm: '2026-01-03T00:00:00.000Z' }],
        }),
      );

      const result = loadCriadores();

      expect(result.criadores).toEqual([{ id: 'creator-1', addedAt: '2026-01-03T00:00:00.000Z', addedBy: null }]);
    });

    it('salva criadores normalizados', () => {
      const saved = saveCriadores({ criadores: ['creator-2'] });

      expect(saved).toBe(true);
      expect(JSON.parse(fs.writeFileSync.mock.calls[0][1])).toEqual({
        criadores: [{ id: 'creator-2', addedAt: null, addedBy: null }],
      });
    });
  });

  describe('loadRoleBindings / saveRoleBindings', () => {
    it('normaliza estrutura de bindings', () => {
      expect(normalizeRoleBindings({ mensalistaRoleByGuild: { 'guild-1': 'role-1' } })).toEqual({
        mensalistaRoleByGuild: { 'guild-1': 'role-1' },
      });
      expect(normalizeRoleBindings({ invalid: true })).toEqual({
        mensalistaRoleByGuild: {},
      });
    });

    it('substitui mapa de bindings ao salvar novo objeto mensalistaRoleByGuild', () => {
      fs.existsSync.mockImplementation((filePath) => filePath === '/test-data/role-bindings.json');
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          mensalistaRoleByGuild: { 'guild-1': 'role-old' },
        }),
      );

      const saved = saveRoleBindings({ mensalistaRoleByGuild: { 'guild-2': 'role-new' } });

      expect(saved).toBe(true);
      expect(JSON.parse(fs.writeFileSync.mock.calls.at(-1)[1])).toEqual({
        mensalistaRoleByGuild: { 'guild-2': 'role-new' },
      });
    });
  });

  describe('loadVotacoes / saveVotacoes', () => {
    it('aceita histórico como array direto', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify([{ id: 'poll-1' }]));

      expect(loadVotacoes()).toEqual([{ id: 'poll-1' }]);
    });

    it('aceita histórico no formato { votacoes: [] }', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ votacoes: [{ id: 'poll-2' }] }));

      expect(loadVotacoes()).toEqual([{ id: 'poll-2' }]);
    });

    it('salva histórico', () => {
      expect(saveVotacoes([{ id: 'poll-3' }])).toBe(true);
    });
  });

  describe('ensureDataFiles', () => {
    it('cria arquivos essenciais ausentes', () => {
      fs.existsSync.mockImplementation((filePath) => filePath === '/test-data');

      ensureDataFiles();

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writtenPaths = fs.writeFileSync.mock.calls.map((call) => call[0]);
      expect(writtenPaths).toEqual(
        expect.arrayContaining([
          '/test-data/mensalistas.json',
          '/test-data/role-bindings.json',
          '/test-data/criadores.json',
          '/test-data/historico.json',
          '/test-data/draft-polls.json',
          '/test-data/active-polls.json',
        ]),
      );
    });
  });
});
