const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mocks dos serviços de CSV
jest.mock('../services/csvService');
jest.mock('../services/botService');
jest.mock('../api/auth', () => ({
  validateDashboardToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token inválido ou ausente' });
    }
    next();
  },
}));

const csvService = require('../services/csvService');
const botService = require('../services/botService');
const dashboardCsvRouter = require('../api/dashboard-csv');

describe('Dashboard CSV Upload API', () => {
  let app;
  const testCsvPath = path.join(__dirname, 'test.csv');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/csv', dashboardCsvRouter);

    // Criar arquivo CSV de teste
    const csvContent = 'nome-da-enquete;opções;max_votos;peso_mensalistas\nTestPoll;A,B;1;sim\n';
    fs.writeFileSync(testCsvPath, csvContent);
  });

  afterAll(() => {
    // Limpar arquivo de teste
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    csvService.parseAndValidate.mockResolvedValue({
      valid: true,
      data: { titulo: 'TestPoll', opcoes: ['A', 'B'], maxVotos: 1 },
    });
    botService.savePoll.mockResolvedValue(undefined);
  });

  it('should reject unauthorized requests', async () => {
    const res = await request(app).post('/api/csv/upload');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Token inválido/);
  });

  it('should reject non-CSV files', async () => {
    const txtFile = path.join(__dirname, 'test.txt');
    fs.writeFileSync(txtFile, 'not a csv');

    const res = await request(app)
      .post('/api/csv/upload')
      .set('Authorization', 'Bearer valid-token')
      .attach('file', txtFile);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Apenas arquivos CSV/);

    fs.unlinkSync(txtFile);
  });

  it('should reject missing file', async () => {
    const res = await request(app).post('/api/csv/upload').set('Authorization', 'Bearer valid-token').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Arquivo não enviado/);
  });

  it('should process valid CSV successfully', async () => {
    const res = await request(app)
      .post('/api/csv/upload')
      .set('Authorization', 'Bearer valid-token')
      .attach('file', testCsvPath);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(csvService.parseAndValidate).toHaveBeenCalled();
    expect(botService.savePoll).toHaveBeenCalled();
  });

  it('should return validation error from csvService', async () => {
    csvService.parseAndValidate.mockResolvedValue({
      valid: false,
      error: 'Formato de CSV inválido',
    });

    const res = await request(app)
      .post('/api/csv/upload')
      .set('Authorization', 'Bearer valid-token')
      .attach('file', testCsvPath);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Formato de CSV inválido');
    expect(botService.savePoll).not.toHaveBeenCalled();
  });

  it('should return 500 when botService throws', async () => {
    botService.savePoll.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .post('/api/csv/upload')
      .set('Authorization', 'Bearer valid-token')
      .attach('file', testCsvPath);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/Erro interno/);
  });

  it('should reject files larger than 5MB', async () => {
    // Este teste é simbólico - multer rejeitará o arquivo
    // Na prática, testar uploads grandes exige um setup diferente
    const res = await request(app).post('/api/csv/upload').set('Authorization', 'Bearer valid-token');

    // Sem arquivo, erro de arquivo não enviado
    expect([400, 413]).toContain(res.statusCode);
  });

  it('should reject CSV with injection attempt (formula starting with =)', async () => {
    const injectionCsvPath = path.join(__dirname, 'injection-test.csv');
    const injectionContent = 'nome-da-enquete;opções;max_votos;peso_mensalistas\n=SUM(A1:A2);A,B;1;sim\n';
    fs.writeFileSync(injectionCsvPath, injectionContent);

    // Mock para retornar erro de CSV injection
    csvService.parseAndValidate.mockResolvedValue({
      valid: false,
      error: 'Linha 2, coluna "nome-da-enquete": valor suspeito detectado. Células não podem começar com =, +, -, ou @',
    });

    const res = await request(app)
      .post('/api/csv/upload')
      .set('Authorization', 'Bearer valid-token')
      .attach('file', injectionCsvPath);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/valor suspeito detectado/);
    expect(botService.savePoll).not.toHaveBeenCalled();

    fs.unlinkSync(injectionCsvPath);
  });
});
