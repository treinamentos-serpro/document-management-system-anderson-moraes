const DocumentServiceError = require('../services/documentServiceError');

const DOCUMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

class DocumentsController {
  constructor(documentsService) {
    this.documentsService = documentsService;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  async upload(req, res) {
    if (!req.file) {
      return sendError(res, 400, 'FILE_REQUIRED', 'O campo file é obrigatório.');
    }

    try {
      const document = await this.documentsService.create(req.file);
      return res.status(201).json({ document });
    } catch (error) {
      if (error instanceof DocumentServiceError) {
        return sendError(res, error.status, error.code, error.message);
      }
      return sendError(res, 500, 'UPLOAD_FAILED', 'Não foi possível enviar o documento.');
    }
  }

  async list(req, res) {
    try {
      const documents = await this.documentsService.list();
      return res.json({ documents });
    } catch (error) {
      return sendError(res, 500, 'DOCUMENT_LIST_FAILED', 'Não foi possível listar os documentos.');
    }
  }

  async download(req, res) {
    if (!DOCUMENT_ID_PATTERN.test(req.params.id)) {
      return sendError(res, 400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.');
    }

    try {
      const document = await this.documentsService.getForDownload(req.params.id);
      return res.download(document.filePath, document.originalName, (error) => {
        if (!error) {
          return;
        }
        if (res.headersSent) {
          return res.destroy(error);
        }
        if (error.code === 'ENOENT') {
          return sendError(res, 404, 'DOCUMENT_FILE_NOT_FOUND', 'O arquivo do documento não foi encontrado.');
        }
        return sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
      });
    } catch (error) {
      if (error instanceof DocumentServiceError) {
        return sendError(res, error.status, error.code, error.message);
      }
      return sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
    }
  }
}

module.exports = DocumentsController;