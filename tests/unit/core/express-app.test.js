process.env.TOKEN = process.env.TOKEN || 'test-token';
process.env.CLIENT_ID = process.env.CLIENT_ID || 'test-client-id';
process.env.APP_ENV = 'staging';
delete process.env.REDIS_URL;

const request = require('supertest');

jest.mock('../../../src/utils/config', () => ({
  APP_ENV: 'staging',
  PORT: 0,
}));

jest.mock('../../../dashboard/api/auth', () => {
  const express = require('express');
  return { authRouter: express.Router() };
});

jest.mock('../../../dashboard/api/dashboard-commands', () => require('express').Router());
jest.mock('../../../dashboard/api/dashboard-polls', () => require('express').Router());
jest.mock('../../../dashboard/api/dashboard-csv', () => require('express').Router());

const { createExpressApp } = require('../../../src/core/express-app');

describe('express-app', () => {
  it('GET /api/health retorna status online', async () => {
    const { app } = createExpressApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Bot Online!');
    expect(response.text).toContain('STAGING');
  });

  it('GET /api/rota-inexistente retorna 404 JSON', async () => {
    const { app } = createExpressApp();

    const response = await request(app).get('/api/rota-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Endpoint de API não encontrado' });
  });
});
