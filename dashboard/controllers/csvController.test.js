// Testes unitários para csvController
const { uploadCsv } = require('./csvController');
const fs = require('fs/promises');
const path = require('path');
const botService = require('../services/botService');
const csvService = require('../services/csvService');

jest.mock('../services/botService');
jest.mock('../services/csvService');

describe('csvController.uploadCsv', () => {
  it('deve retornar erro se arquivo não enviado', async () => {
    const req = { file: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await uploadCsv(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Arquivo não enviado.' });
  });

  it('deve processar CSV e salvar JSON se válido', async () => {
    const req = { file: { path: 'fake.csv' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    csvService.parseAndValidate.mockResolvedValue({ valid: true, data: [{ id: '1', name: 'Ana' }] });
    botService.savePoll.mockResolvedValue();
    await uploadCsv(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('deve retornar erro se CSV inválido', async () => {
    const req = { file: { path: 'fake.csv' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    csvService.parseAndValidate.mockResolvedValue({ valid: false, error: 'Erro de validação' });
    await uploadCsv(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro de validação' });
  });
});
