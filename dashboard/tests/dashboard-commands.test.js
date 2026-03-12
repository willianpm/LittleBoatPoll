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
});
