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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `poll-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    const validationError = new Error('Apenas arquivos CSV são aceitos');
    validationError.statusCode = 400;
    cb(validationError, false);
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
 * Recebe arquivo CSV e processa para criar/atualizar enquetes.
 * O tratamento de erro e limpeza de arquivo é delegado para o middleware de erro.
 */
router.post('/upload', validateDashboardToken, upload.single('file'), uploadCsv);

// Middleware de tratamento de erros centralizado para a rota de upload
router.use((err, req, res, next) => {
  // Garante que o arquivo temporário seja removido em caso de qualquer erro
  const filePath = req.file?.path || err.filePath;
  if (filePath && !req.tempFileCleaned) {
    fs.promises
      .unlink(filePath)
      .then(() => console.log(`[ErrorHandler] Arquivo temporário deletado: ${filePath}`))
      .catch((unlinkErr) => console.error(`[ErrorHandler] Falha ao deletar arquivo temporário: ${unlinkErr.message}`));
  }

  // Tratamento de erros específicos do Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }

  // Tratamento de erros customizados ou do controller
  if (err) {
    const statusCode = err.statusCode || 500;
    const message = statusCode >= 500 ? 'Erro interno no servidor.' : err.message;
    console.error(`[ErrorHandler] Erro ${statusCode}: ${message}`);
    return res.status(statusCode).json({ error: message });
  }

  next();
});

module.exports = router;
