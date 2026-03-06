// Controller para upload e processamento de CSV
// Contrato: uploadCsv(req, res)

const fs = require('fs');
const csvService = require('../services/csvService');
const botService = require('../services/botService');

/**
 * Recebe upload de CSV, processa e salva para o bot
 * @param {object} req Requisição (espera req.file.path)
 * @param {object} res Resposta
 */
async function uploadCsv(req, res) {
  const filePath = req.file?.path;

  try {
    if (!req.file || !filePath) {
      console.error('[csvController] Nenhum arquivo enviado.');
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }

    const result = await csvService.parseAndValidate(filePath);

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
  } finally {
    // Limpar arquivo temporário após processamento (sucesso ou erro)
    if (filePath) {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.warn(`[csvController] Aviso ao deletar arquivo temporário: ${unlinkErr.message}`);
        } else {
          console.log(`[csvController] Arquivo temporário deletado: ${filePath}`);
        }
      });
    }
  }
}

module.exports = { uploadCsv };
