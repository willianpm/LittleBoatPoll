const request = require('supertest');
const express = require('express');

// Mock do client para evitar dependência real do Discord
jest.mock('../../src/core/client', () => ({
  client: {
    commands: new Map(),
    guilds: { cache: new Map() },
  },
}));

const dashboardCommandsRouter = require('../api/dashboard-commands');

describe('Dashboard Commands API', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/commands', dashboardCommandsRouter);
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

  // Testes adicionais podem ser criados para comandos reais, guild, permissões, etc.
});
