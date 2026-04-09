// Controller para upload e processamento de CSV
// Contrato: uploadCsv(req, res)

const fs = require('fs').promises;
const csvService = require('../services/csvService');
const botService = require('../services/botService');

/**
 * Recebe upload de CSV, processa e salva para o bot
 * @param {object} req Requisição (espera req.file.path)
 * @param {object} res Resposta
 * @param {function} next Próximo middleware
 */
async function uploadCsv(req, res, next) {
  const filePath = req.file?.path;
  let cleanupHandledByErrorMiddleware = false;

  try {
    if (!req.file || !filePath) {
      const err = new Error('Arquivo não enviado.');
      err.statusCode = 400;
      throw err;
    }

    const result = await csvService.parseAndValidate(filePath, {
      userId: req.dashboardAuth?.userId || null,
      username: req.dashboardAuth?.username || 'dashboard-csv',
    });

    if (result.valid) {
      await botService.savePoll(result.data);
      res.status(200).json({
        success: true,
        draftsCreated: Array.isArray(result.data) ? result.data.length : 0,
        note: 'CSV importado como rascunho. Use o comando `/rascunho publicar` para criar a enquete ativa no Discord.',
      });
    } else {
      const err = new Error(result.error);
      err.statusCode = 400;
      throw err;
    }
  } catch (err) {
    if (filePath) {
      err.filePath = filePath;
    }

    if (typeof next === 'function') {
      cleanupHandledByErrorMiddleware = true;
      return next(err);
    }

    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }

    return res.status(statusCode).json({ error: err.message });
  } finally {
    if (filePath && !cleanupHandledByErrorMiddleware) {
      try {
        await fs.unlink(filePath);
        req.tempFileCleaned = true;
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') {
          // Log silenciosamente se falhar, não queremos quebrar a resposta
        } else {
          req.tempFileCleaned = true;
        }
      }
    }
  }
}

module.exports = { uploadCsv };
