const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const DocumentsController = require('./controllers/documents.controller');
const DocumentsRepository = require('./repositories/documents.repository');
const createDocumentsRoutes = require('./routes/documents.routes');
const DocumentsService = require('./services/documents.service');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function createApp(options = {}) {
  const storageDir = path.resolve(
    options.storageDir || process.env.STORAGE_DIR || path.join(__dirname, '../storage'),
  );
  const maxFileSizeBytes = Number(
    options.maxFileSizeBytes ?? process.env.MAX_FILE_SIZE_BYTES ?? DEFAULT_MAX_FILE_SIZE_BYTES,
  );

  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes < 1) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  fs.mkdirSync(storageDir, { recursive: true });

  const documentsRepository = new DocumentsRepository(storageDir);
  const documentsService = new DocumentsService(documentsRepository);
  const documentsController = new DocumentsController(documentsService);
  const app = express();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentsRoutes({
    controller: documentsController,
    uploadMiddleware: documentsRepository.createUploadMiddleware(maxFileSizeBytes),
  }));

  return app;
}

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
