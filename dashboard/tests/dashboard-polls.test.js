const request = require('supertest');
const express = require('express');

jest.mock('../api/auth', () => ({
  validateDashboardToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token inválido ou ausente' });
    }

    req.dashboardAuth = {
      userId: 'user-1',
      username: 'dashboard-user',
      guildId: 'guild-1',
      accessibleGuildIds: ['guild-1'],
      member: { id: 'user-1' },
    };

    return next();
  },
}));

jest.mock('../../src/core/client', () => ({
  client: {
    guilds: { cache: new Map() },
    activePolls: new Map(),
  },
}));

jest.mock('../../src/utils/file-handler', () => ({
  loadVotacoes: jest.fn(),
}));

const { client } = require('../../src/core/client');
const { loadVotacoes } = require('../../src/utils/file-handler');
const dashboardPollsRouter = require('../api/dashboard-polls');

describe('Dashboard Polls API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/polls', dashboardPollsRouter);
  });

  beforeEach(() => {
    client.guilds.cache = new Map([
      [
        'guild-1',
        {
          id: 'guild-1',
          name: 'Guild One',
          channels: {
            cache: new Map([
              [
                'channel-1',
                {
                  id: 'channel-1',
                  name: 'geral',
                },
              ],
            ]),
          },
        },
      ],
    ]);

    client.activePolls = new Map([
      [
        'active-1',
        {
          messageId: 'active-1',
          guildId: 'guild-1',
          channelId: 'channel-1',
          titulo: 'Enquete ativa',
          opcoes: ['A', 'B'],
          emojiNumeros: ['1️⃣', '2️⃣'],
          maxVotos: 1,
          usarPesoMensalista: false,
          criadoEm: '2026-04-05T10:00:00Z',
          endsAt: '2099-04-06T10:00:00Z',
          durationKey: '24h',
          votos: {
            'user-2': { peso: 1, reacoes: ['1️⃣'] },
          },
        },
      ],
      [
        'active-expired',
        {
          messageId: 'active-expired',
          guildId: 'guild-1',
          channelId: 'channel-1',
          titulo: 'Enquete ativa expirada',
          opcoes: ['C', 'D'],
          emojiNumeros: ['3️⃣', '4️⃣'],
          maxVotos: 1,
          usarPesoMensalista: false,
          criadoEm: '2026-03-01T10:00:00Z',
          endsAt: '2000-03-01T10:00:00Z',
          durationKey: '24h',
          votos: {},
        },
      ],
    ]);

    loadVotacoes.mockReturnValue([
      {
        id: 'history-1',
        titulo: 'Enquete encerrada',
        description: 'Descrição encerrada',
        guildId: 'guild-1',
        guildName: 'Guild One',
        channelId: 'channel-1',
        channelName: 'geral',
        status: 'ended',
        dataCriacao: '2026-04-01T10:00:00Z',
        dataFinalizacao: '2026-04-02T10:00:00Z',
        resultados: [
          { id: 'opt-1', text: 'Voto A', pontos: 4, emoji: '1️⃣' },
          { id: 'opt-2', text: 'Voto B', pontos: 2, emoji: '2️⃣' },
        ],
        participantes: 3,
        maxVotos: 1,
        allowMultipleChoices: false,
        anonymous: false,
      },
    ]);
  });

  it('should return poll history with active and ended polls', async () => {
    const res = await request(app).get('/api/polls/history').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.polls)).toBe(true);
    expect(res.body.polls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'active-1',
          title: 'Enquete ativa',
          serverId: 'guild-1',
          serverName: 'Guild One',
          channelName: 'geral',
          endsAt: '2099-04-06T10:00:00Z',
          durationKey: '24h',
          status: 'active',
        }),
        expect.objectContaining({
          id: 'active-expired',
          title: 'Enquete ativa expirada',
          endsAt: '2000-03-01T10:00:00Z',
          status: 'ended',
        }),
        expect.objectContaining({
          id: 'history-1',
          title: 'Enquete encerrada',
          serverName: 'Guild One',
          channelName: 'geral',
          status: 'ended',
        }),
      ]),
    );
  });

  it('should return a specific poll detail by id', async () => {
    const res = await request(app).get('/api/polls/history-1').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.poll).toEqual(
      expect.objectContaining({
        id: 'history-1',
        description: 'Descrição encerrada',
        totalVotes: 6,
        options: expect.arrayContaining([
          expect.objectContaining({ text: 'Voto A', votes: 4 }),
          expect.objectContaining({ text: 'Voto B', votes: 2 }),
        ]),
      }),
    );
  });

  it('should normalize custom emojis embedded in poll option text', async () => {
    loadVotacoes.mockReturnValue([
      {
        id: 'history-emoji',
        titulo: 'Enquete com emoji custom',
        guildId: 'guild-1',
        guildName: 'Guild One',
        channelId: 'channel-1',
        channelName: 'geral',
        status: 'ended',
        dataCriacao: '2026-04-01T10:00:00Z',
        dataFinalizacao: '2026-04-02T10:00:00Z',
        resultados: [
          { id: 'opt-1', text: '<:livro:123456789012345678> Opção A', pontos: 1 },
          { id: 'opt-2', text: '<a:animado:123456789012345679> Opção B', pontos: 2 },
        ],
        participantes: 3,
        maxVotos: 1,
        allowMultipleChoices: false,
        anonymous: false,
      },
    ]);

    const res = await request(app).get('/api/polls/history-emoji').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.poll).toEqual(
      expect.objectContaining({
        id: 'history-emoji',
        options: expect.arrayContaining([
          expect.objectContaining({
            text: 'Opção A',
            emoji: '<:livro:123456789012345678>',
            emojiId: '123456789012345678',
            emojiAnimated: false,
          }),
          expect.objectContaining({
            text: 'Opção B',
            emoji: '<a:animado:123456789012345679>',
            emojiId: '123456789012345679',
            emojiAnimated: true,
          }),
        ]),
      }),
    );
  });

  it('should return 404 for missing poll detail', async () => {
    const res = await request(app).get('/api/polls/missing-id').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Enquete não encontrada');
  });
});
