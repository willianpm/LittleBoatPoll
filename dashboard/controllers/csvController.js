// Controller para upload e processamento de CSV
// Contrato: uploadCsv(req, res)

const csvService = require('../services/csvService');
const botService = require('../services/botService');

/**
 * Recebe upload de CSV, processa e salva para o bot
 * @param {object} req Requisição (espera req.file.path)
 * @param {object} res Resposta
 */
async function uploadCsv(req, res) {
  try {
    const file = req.file;
    if (!file || !file.path) {
      console.error('[csvController] Nenhum arquivo enviado.');
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }
    const result = await csvService.parseAndValidate(file.path);
    if (result.valid) {
      await botService.savePoll(result.data);
      console.log('[csvController] Upload e processamento concluídos com sucesso.');
      res.status(200).json({ success: true });
    } else {
      console.error(`[csvController] Erro de validação: ${result.error}`);
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    console.error(`[csvController] Erro inesperado: ${err.message}`);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

module.exports = { uploadCsv };
