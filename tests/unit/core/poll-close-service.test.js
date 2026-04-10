jest.mock('../../../src/utils/file-handler', () => ({
  loadVotacoes: jest.fn(() => []),
  saveVotacoes: jest.fn(),
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { loadVotacoes, saveVotacoes } = require('../../../src/utils/file-handler');
const { closePollByMessageId, computePollResults } = require('../../../src/core/poll-close-service');

describe('poll-close-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadVotacoes.mockReturnValue([]);
    saveVotacoes.mockImplementation(() => {});
  });

  it('uses weight 1 fallback when vote weight is missing', () => {
    const poll = {
      opcoes: ['A', 'B'],
      emojiNumeros: ['1️⃣', '2️⃣'],
      votos: {
        userA: { usuario: 'userA', peso: 2, reacoes: ['1️⃣'] },
        userB: { usuario: 'userB', reacoes: ['1️⃣'] },
        userC: { usuario: 'userC', peso: 'x', reacoes: ['2️⃣'] },
      },
    };

    const { resultados, vencedor, empate } = computePollResults(poll);

    expect(resultados).toHaveLength(2);
    expect(resultados[0]).toEqual(
      expect.objectContaining({
        opcao: 'A',
        pontos: 3,
      }),
    );
    expect(resultados[1]).toEqual(
      expect.objectContaining({
        opcao: 'B',
        pontos: 1,
      }),
    );
    expect(vencedor.opcao).toBe('A');
    expect(empate).toBe(false);
  });

  it('restores active status before persisting rollback on close failure', async () => {
    const poll = {
      titulo: 'Enquete teste',
      opcoes: ['A'],
      emojiNumeros: ['1️⃣'],
      maxVotos: 1,
      usarPesoMensalista: false,
      votos: {
        userA: { usuario: 'userA', peso: 1, reacoes: ['1️⃣'] },
      },
      criadoEm: '2026-04-10T10:00:00.000Z',
      status: 'ativa',
    };

    const saveSnapshots = [];
    const client = {
      activePolls: new Map([['msg-1', poll]]),
      saveActivePolls: jest.fn(() => {
        const current = client.activePolls.get('msg-1');
        saveSnapshots.push(
          current
            ? {
              status: current.status,
              hasFinalizadaEm: Object.prototype.hasOwnProperty.call(current, 'finalizadaEm'),
            }
            : null,
        );
      }),
      users: {
        fetch: jest.fn(),
      },
      channels: {
        fetch: jest.fn(),
      },
    };

    saveVotacoes.mockImplementation(() => {
      throw new Error('falha ao salvar historico');
    });

    const result = await closePollByMessageId({
      client,
      messageId: 'msg-1',
      reason: 'manual',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('POLL_CLOSE_FAILED');
    expect(client.activePolls.has('msg-1')).toBe(true);
    expect(client.activePolls.get('msg-1').status).toBe('ativa');
    expect(client.activePolls.get('msg-1').finalizadaEm).toBeUndefined();
    expect(client.saveActivePolls).toHaveBeenCalledTimes(2);
    expect(saveSnapshots[0]).toBeNull();
    expect(saveSnapshots[1]).toEqual({
      status: 'ativa',
      hasFinalizadaEm: false,
    });
  });

  it('rolls back close when saveVotacoes returns false', async () => {
    const poll = {
      titulo: 'Enquete teste',
      opcoes: ['A'],
      emojiNumeros: ['1️⃣'],
      maxVotos: 1,
      usarPesoMensalista: false,
      votos: {
        userA: { usuario: 'userA', peso: 1, reacoes: ['1️⃣'] },
      },
      criadoEm: '2026-04-10T10:00:00.000Z',
      status: 'ativa',
    };

    const saveSnapshots = [];
    const client = {
      activePolls: new Map([['msg-1', poll]]),
      saveActivePolls: jest.fn(() => {
        const current = client.activePolls.get('msg-1');
        saveSnapshots.push(
          current
            ? {
              status: current.status,
              hasFinalizadaEm: Object.prototype.hasOwnProperty.call(current, 'finalizadaEm'),
            }
            : null,
        );
      }),
      users: {
        fetch: jest.fn(),
      },
      channels: {
        fetch: jest.fn(),
      },
    };

    saveVotacoes.mockReturnValue(false);

    const result = await closePollByMessageId({
      client,
      messageId: 'msg-1',
      reason: 'manual',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('POLL_CLOSE_FAILED');
    expect(client.activePolls.has('msg-1')).toBe(true);
    expect(client.activePolls.get('msg-1').status).toBe('ativa');
    expect(client.activePolls.get('msg-1').finalizadaEm).toBeUndefined();
    expect(client.saveActivePolls).toHaveBeenCalledTimes(2);
    expect(saveSnapshots[0]).toBeNull();
    expect(saveSnapshots[1]).toEqual({
      status: 'ativa',
      hasFinalizadaEm: false,
    });
  });
});
