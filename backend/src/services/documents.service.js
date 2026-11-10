const { randomUUID } = require('node:crypto');
const path = require('node:path');
const DocumentServiceError = require('./documentServiceError');

const DEFAULT_OWNER = 'local-user';

function getSafeOriginalName(originalName) {
  const fileName = path.basename(String(originalName || '').replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return fileName || 'document';
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

class DocumentsService {
  constructor(documentsRepository) {
    this.documentsRepository = documentsRepository;
  }

  async create(file) {
    if (!file.size) {
      await this.documentsRepository.removeFile(file.filename).catch(() => {});
      throw new DocumentServiceError('FILE_REQUIRED', 400, 'O arquivo não pode estar vazio.');
    }

    const document = {
      id: randomUUID(),
      originalName: getSafeOriginalName(file.originalname),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: DEFAULT_OWNER,
      storageName: file.filename,
    };

    try {
      await this.documentsRepository.save(document);
      return toPublicDocument(document);
    } catch (error) {
      await this.documentsRepository.removeFile(file.filename).catch(() => {});
      throw new DocumentServiceError('UPLOAD_FAILED', 500, 'Não foi possível enviar o documento.');
    }
  }

  async list() {
    const documents = await this.documentsRepository.findAllByOwner(DEFAULT_OWNER);
    return documents.map(toPublicDocument);
  }

  async getForDownload(id) {
    const document = await this.documentsRepository.findById(id);
    if (!document) {
      throw new DocumentServiceError('DOCUMENT_NOT_FOUND', 404, 'Documento não encontrado.');
    }

    const exists = await this.documentsRepository.fileExists(document.storageName);
    if (!exists) {
      throw new DocumentServiceError('DOCUMENT_FILE_NOT_FOUND', 404, 'O arquivo do documento não foi encontrado.');
    }

    return {
      filePath: this.documentsRepository.getFilePath(document.storageName),
      originalName: document.originalName,
    };
  }
}

module.exports = DocumentsService;