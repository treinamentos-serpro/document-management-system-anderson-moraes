const { randomUUID } = require('node:crypto');
const DocumentServiceError = require('./documentServiceError');
const { getSafeOriginalName, toPublicDocument } = require('./documents.mapper');

const DEFAULT_OWNER = 'local-user';

async function removeUploadedFile(repository, filename) {
  try {
    await repository.removeFile(filename);
  } catch {
    return;
  }
}

class DocumentsService {
  constructor(documentsRepository) {
    this.documentsRepository = documentsRepository;
  }

  async create(file) {
    if (!file.size) {
      await removeUploadedFile(this.documentsRepository, file.filename);
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
      await removeUploadedFile(this.documentsRepository, file.filename);
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