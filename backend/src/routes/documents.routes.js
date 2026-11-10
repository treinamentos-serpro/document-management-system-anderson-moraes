const express = require('express');
const multer = require('multer');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function createDocumentsRoutes({ controller, uploadMiddleware }) {
  const router = express.Router();

  router.post('/upload', (req, res, next) => {
    if (!req.is('multipart/form-data')) {
      return sendError(res, 400, 'INVALID_MULTIPART', 'Envie o arquivo como multipart/form-data.');
    }
    return next();
  }, uploadMiddleware, controller.upload);

  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  router.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'FILE_TOO_LARGE', 'O arquivo excede o tamanho máximo permitido.');
    }

    if (error instanceof multer.MulterError || /Unexpected end of form|Boundary not found/i.test(error.message)) {
      return sendError(res, 400, 'INVALID_MULTIPART', 'A requisição multipart é inválida.');
    }

    return sendError(res, 500, 'UPLOAD_FAILED', 'Não foi possível enviar o documento.');
  });

  return router;
}

module.exports = createDocumentsRoutes;