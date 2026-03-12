// Rota para upload de CSV via Dashboard
// Endpoint: POST /api/csv/upload
// Middleware: multer para parsing de multipart/form-data

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadCsv } = require('../controllers/csvController');
const { validateDashboardToken } = require('./auth');

const router = express.Router();

// Configurar storage temporário para uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Preservar extensão original (idealmente .csv)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `poll-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas CSV
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos CSV são aceitos'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

/**
 * POST /api/csv/upload
 * Recebe arquivo CSV e processa para criar/atualizar enquetes
 *
 * @param {File} file Campo multipart com arquivo CSV
 * @param {string} token Token de autenticação (query param ou header)
 * @returns {JSON} { success: true } ou { error: "mensagem" }
 */
router.post('/upload', validateDashboardToken, upload.single('file'), async (req, res) => {
  // Após o middleware multer processar, chamar o controller
  try {
    await uploadCsv(req, res);
  } catch (err) {
    console.error(`[dashboard-csv] Erro ao processar CSV: ${err.message}`);
    // Limpar arquivo se algo deu errado
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error(`Erro ao deletar arquivo: ${unlinkErr.message}`);
      });
    }
    res.status(500).json({ error: 'Erro interno no servidor ao processar CSV' });
  }
});

// Middleware de error handling específico para multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Campo de arquivo inesperado.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }

  if (err && err.message === 'Apenas arquivos CSV são aceitos') {
    return res.status(400).json({ error: 'Apenas arquivos CSV são aceitos' });
  }

  // Outros erros
  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
});

module.exports = router;
