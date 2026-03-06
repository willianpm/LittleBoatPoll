const request = require('supertest');
const express = require('express');

// Mock do client para evitar dependência real do Discord
jest.mock('../../src/core/client', () => ({
  client: {
    commands: new Map(),
    guilds: { cache: new Map() },
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
  });

  it('should reject unauthorized requests', async () => {
    const res = await request(app).post('/api/commands/poll').send({}).set('Authorization', '');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Token inválido/);
  });

  it('should return 404 for unknown command', async () => {
    const res = await request(app).post('/api/commands/unknowncmd').send({}).set('Authorization', 'Bearer fake');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Comando não encontrado/);
  });

  it('should return 403 when bot is not in target guild', async () => {
    client.commands.set('poll', {
      execute: jest.fn(),
    });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-missing' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Bot não está presente na guild informada/);
  });

  it('should return command reply payload for a valid command execution', async () => {
    const executeMock = jest.fn(async (interaction) => {
      await interaction.reply({ ok: true, source: 'dashboard' });
    });

    client.commands.set('poll', { execute: executeMock });
    client.guilds.cache.set('guild-1', { id: 'guild-1', name: 'Guild 1' });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-1' }, user: { id: 'user-1' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, source: 'dashboard' });
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when command execution throws', async () => {
    client.commands.set('poll', {
      execute: jest.fn(async () => {
        throw new Error('boom');
      }),
    });
    client.guilds.cache.set('guild-1', { id: 'guild-1', name: 'Guild 1' });

    const res = await request(app)
      .post('/api/commands/poll')
      .send({ guild: { id: 'guild-1' } })
      .set('Authorization', 'Bearer fake');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('boom');
  });
});
