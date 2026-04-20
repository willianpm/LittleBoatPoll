const request = require('supertest');
const express = require('express');

jest.mock('../api/auth', () => ({
  validateDashboardToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token inválido ou ausente' });
    }
    req.dashboardAuth = {
      userId: req.body?.user?.id || 'user-1',
      username: req.body?.user?.username || 'dashboard-user',
      guildId: req.body?.guild?.id || 'guild-1',
      accessibleGuildIds: [req.body?.guild?.id || 'guild-1'],
      member: req.body?.member || { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } },
    };
    return next();
  },
}));

// Mock do client para evitar dependência real do Discord
jest.mock('../../src/core/client', () => ({
  client: {
    commands: new Map(),
    guilds: { cache: new Map() },
    activePolls: new Map(),
    draftPolls: new Map(),
  },
}));

jest.mock('../../src/utils/config', () => ({
  DATA_FILES: {
    draftPolls: './__tmp_drafts__.json',
  },
}));

const { client } = require('../../src/core/client');
const dashboardCommandsRouter = require('../api/dashboard-commands');

describe('Dashboard Commands API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/commands', dashboardCommandsRouter);
  });

  beforeEach(() => {
    client.commands = new Map();
    client.guilds = { cache: new Map() };
    client.activePolls = new Map();
    client.draftPolls = new Map();
    client.isReady = undefined;
  });

  it('should reject unauthorized requests', async () => {
    const res = await request(app).post('/api/commands/poll').send({}).set('Authorization', '');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Token inválido/);
    expect(res.body.success).toBeUndefined();
  });

  it('should return 404 for unknown command', async () => {
    const res = await request(app).post('/api/commands/unknowncmd').send({}).set('Authorization', 'Bearer fake');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Comando inválido|não encontrado/i);
  });

  it('should return command catalog including command type metadata', async () => {
    client.commands.set('enquete', {
      data: {
        toJSON: () => ({ name: 'enquete', description: 'Cria enquete', type: 1, options: [] }),
      },
    });

    const res = await request(app).get('/api/commands/catalog').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.commands)).toBe(true);
    expect(res.body.commands[0]).toEqual(
      expect.objectContaining({
        name: 'enquete',
        type: 1,
        typeLabel: 'chat-input',
      }),
    );
  });

  it('should return 404 when bot is not in target guild', async () => {
    client.commands.set('poll', {
      execute: jest.fn(),
    });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-missing' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Bot não está conectado ao servidor selecionado/);
  });

  it('should return friendly success payload for a valid command execution', async () => {
    const executeMock = jest.fn(async (interaction) => {
      await interaction.reply({ content: 'Comando finalizado com sucesso.' });
    });

    client.commands.set('poll', { execute: executeMock });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: { cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]) },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-1' }, user: { id: 'user-1' }, target: { channelId: 'channel-1' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Comando finalizado com sucesso.');
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when command execution throws', async () => {
    client.commands.set('poll', {
      execute: jest.fn(async () => {
        throw new Error('boom');
      }),
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: { cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]) },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-1' }, target: { channelId: 'channel-1' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Erro interno ao executar comando');
  });

  it('should return 503 when bot is offline', async () => {
    client.isReady = jest.fn(() => false);
    client.commands.set('poll', {
      execute: jest.fn(),
    });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-1' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Bot está offline/);
  });

  it('should return 400 for chat-input command without channelId', async () => {
    client.commands.set('enquete', {
      data: {
        toJSON: () => ({ name: 'enquete', description: 'Cria enquete', type: 1, options: [] }),
      },
      execute: jest.fn(),
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: {
        cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]),
      },
      systemChannel: null,
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    // No target.channelId provided
    const res = await request(app)
      .post('/api/commands/enquete')
      .send({ guild: { id: 'guild-1' }, commandType: 1 })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/channelId é obrigatório/i);
  });

  it('should execute chat-input command when channelId is provided', async () => {
    const executeMock = jest.fn(async (interaction) => {
      await interaction.reply({ content: 'Enquete criada!' });
    });

    client.commands.set('enquete', {
      data: {
        toJSON: () => ({ name: 'enquete', description: 'Cria enquete', type: 1, options: [] }),
      },
      execute: executeMock,
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: {
        cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]),
      },
      systemChannel: null,
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/enquete')
      .send({ guild: { id: 'guild-1' }, commandType: 1, target: { channelId: 'channel-1' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Enquete criada!');
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('should execute user context command with selected target', async () => {
    const executeMock = jest.fn(async (interaction) => {
      await interaction.reply({ content: `Usuário alvo ${interaction.targetUser?.id || 'desconhecido'}` });
    });

    client.commands.set('Add/Del Mensalistas', {
      data: {
        toJSON: () => ({ name: 'Add/Del Mensalistas', type: 2, options: [] }),
      },
      execute: executeMock,
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: { cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]) },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/Add%2FDel%20Mensalistas')
      .send({ guild: { id: 'guild-1' }, commandType: 2, target: { userId: 'user-777' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/user-777/i);
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('should return dashboard drafts with creator and options metadata', async () => {
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: { cache: new Map([['channel-1', { id: 'channel-1', name: 'geral', isTextBased: () => true }]]) },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    client.draftPolls.set('DRAFT-1', {
      id: 'DRAFT-1',
      titulo: 'Enquete dashboard',
      opcoes: [
        { text: 'Opção A', emoji: '😀' },
        { text: 'Opção B', emoji: '<:livro:123456789012345678>' },
        { text: 'Opção C', emoji: '📚' },
      ],
      guildId: 'guild-1',
      channelId: 'channel-1',
      maxVotos: -2,
      criadorId: 'user-42',
      criadorNome: 'willian',
      origem: 'dashboard-create',
      criadoEm: '2026-04-01T10:00:00.000Z',
      editadoEm: '2026-04-02T10:00:00.000Z',
    });

    client.draftPolls.set('DRAFT-2', {
      id: 'DRAFT-2',
      titulo: 'Enquete discord',
      opcoes: ['A', 'B'],
      criadorId: 'user-99',
      criadorNome: 'outro-user',
      origem: 'discord',
      criadoEm: '2026-04-01T10:00:00.000Z',
      editadoEm: '2026-04-02T10:00:00.000Z',
    });

    const res = await request(app).get('/api/commands/context-targets/drafts').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.drafts)).toBe(true);
    expect(res.body.drafts).toHaveLength(1);
    expect(res.body.drafts[0]).toEqual(
      expect.objectContaining({
        id: 'DRAFT-1',
        title: 'Enquete dashboard',
        guildId: 'guild-1',
        channelId: 'channel-1',
        serverName: 'Guild 1',
        channelName: 'geral',
        optionsCount: 3,
        creatorId: 'user-42',
        creatorName: 'willian',
        options: [
          { text: 'Opção A', emoji: '😀' },
          { text: 'Opção B', emoji: '<:livro:123456789012345678>' },
          { text: 'Opção C', emoji: '📚' },
        ],
        maxVotes: 1,
      }),
    );
  });

  it('should not return drafts from unauthorized guilds', async () => {
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: { cache: new Map([['channel-1', { id: 'channel-1', name: 'geral', isTextBased: () => true }]]) },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });
    client.guilds.cache.set('guild-2', {
      id: 'guild-2',
      name: 'Guild 2',
      channels: { cache: new Map([['channel-2', { id: 'channel-2', name: 'off-topic', isTextBased: () => true }]]) },
      members: {
        cache: new Map([['user-2', { id: 'user-2', permissions: { has: () => true }, guild: { ownerId: 'owner-2' } }]]),
      },
    });

    client.draftPolls.set('DRAFT-1', {
      id: 'DRAFT-1',
      titulo: 'Enquete guild 1',
      opcoes: [
        { text: 'A', emoji: '🅰️' },
        { text: 'B', emoji: '🅱️' },
      ],
      guildId: 'guild-1',
      channelId: 'channel-1',
      criadorId: 'user-1',
      criadorNome: 'willian',
      origem: 'dashboard-create',
      criadoEm: '2026-04-01T10:00:00.000Z',
      editadoEm: '2026-04-02T10:00:00.000Z',
    });

    client.draftPolls.set('DRAFT-2', {
      id: 'DRAFT-2',
      titulo: 'Enquete guild 2',
      opcoes: [
        { text: 'C', emoji: '🇨' },
        { text: 'D', emoji: '🇩' },
      ],
      guildId: 'guild-2',
      channelId: 'channel-2',
      criadorId: 'user-2',
      criadorNome: 'outro-user',
      origem: 'dashboard-create',
      criadoEm: '2026-04-01T10:00:00.000Z',
      editadoEm: '2026-04-02T10:00:00.000Z',
    });

    const res = await request(app).get('/api/commands/context-targets/drafts').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.drafts)).toBe(true);
    expect(res.body.drafts).toHaveLength(1);
    expect(res.body.drafts[0].id).toBe('DRAFT-1');
  });

  it('should return resolved guildId for legacy dashboard draft with only channelId', async () => {
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: { cache: new Map([['channel-1', { id: 'channel-1', name: 'geral', isTextBased: () => true }]]) },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    client.draftPolls.set('DRAFT-LEGACY', {
      id: 'DRAFT-LEGACY',
      titulo: 'Enquete legado',
      opcoes: ['Opção A', 'Opção B'],
      guildId: null,
      channelId: 'channel-1',
      criadorId: 'user-42',
      criadorNome: 'willian',
      origem: 'dashboard-create',
      criadoEm: '2026-04-01T10:00:00.000Z',
      editadoEm: '2026-04-02T10:00:00.000Z',
    });

    const res = await request(app).get('/api/commands/context-targets/drafts').set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.drafts)).toBe(true);
    expect(res.body.drafts).toHaveLength(1);
    expect(res.body.drafts[0]).toEqual(
      expect.objectContaining({
        id: 'DRAFT-LEGACY',
        guildId: 'guild-1',
        channelId: 'channel-1',
        serverName: 'Guild 1',
        channelName: 'geral',
        options: [
          { text: 'Opção A', emoji: null },
          { text: 'Opção B', emoji: null },
        ],
      }),
    );
  });

  it('should reject rascunho criar without explicit guild id in strict dashboard flow', async () => {
    client.commands.set('rascunho', {
      data: {
        toJSON: () => ({ name: 'rascunho', description: 'Gerencia rascunhos', type: 1, options: [] }),
      },
      execute: jest.fn(),
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: {
        cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]),
      },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/rascunho')
      .send({
        commandType: 1,
        dashboardSource: 'dashboard-create',
        options: {
          subcommand: 'criar',
          values: {
            titulo: 'Teste',
            opcoes: 'A, B',
            max_votos: 1,
          },
        },
        target: { channelId: 'channel-1' },
      })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/guild\.id é obrigatório/i);
  });

  it('should pass duration option for rascunho criar from dashboard payload', async () => {
    const executeMock = jest.fn(async (interaction) => {
      const duracao = interaction.options.getString('duracao');
      await interaction.reply({ content: `duração recebida: ${duracao}` });
    });

    client.commands.set('rascunho', {
      data: {
        toJSON: () => ({ name: 'rascunho', description: 'Gerencia rascunhos', type: 1, options: [] }),
      },
      execute: executeMock,
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: {
        cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]),
      },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/rascunho')
      .send({
        commandType: 1,
        guild: { id: 'guild-1' },
        dashboardSource: 'dashboard-create',
        options: {
          subcommand: 'criar',
          values: {
            titulo: 'Teste duração',
            opcoes: 'A, B',
            max_votos: 1,
            duracao: '6h',
          },
        },
        target: { channelId: 'channel-1' },
      })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/6h/i);
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('should reject rascunho publicar when selected channel is missing in guild', async () => {
    client.commands.set('rascunho', {
      data: {
        toJSON: () => ({ name: 'rascunho', description: 'Gerencia rascunhos', type: 1, options: [] }),
      },
      execute: jest.fn(),
    });
    client.guilds.cache.set('guild-1', {
      id: 'guild-1',
      name: 'Guild 1',
      channels: {
        cache: new Map([['channel-1', { id: 'channel-1', isTextBased: () => true, send: jest.fn() }]]),
      },
      systemChannel: { id: 'system-1', isTextBased: () => true, send: jest.fn() },
      members: {
        cache: new Map([['user-1', { id: 'user-1', permissions: { has: () => true }, guild: { ownerId: 'owner-1' } }]]),
      },
    });

    const res = await request(app)
      .post('/api/commands/rascunho')
      .send({
        commandType: 1,
        guild: { id: 'guild-1' },
        dashboardSource: 'dashboard-drafts',
        target: { channelId: 'channel-missing' },
        options: {
          subcommand: 'publicar',
          values: { id: 'DRAFT-1' },
        },
      })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Canal selecionado não encontrado/i);
  });
});
