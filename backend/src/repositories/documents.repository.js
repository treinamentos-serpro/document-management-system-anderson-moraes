const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

class DocumentsRepository {
  constructor(storageDir) {
    this.storageDir = storageDir;
    this.documents = new Map();
  }

  createUploadMiddleware(maxFileSizeBytes) {
    const storage = multer.diskStorage({
      destination: (req, file, callback) => callback(null, this.storageDir),
      filename: (req, file, callback) => callback(null, randomUUID()),
    });

    return multer({
      storage,
      limits: { fileSize: maxFileSizeBytes, files: 1 },
    }).single('file');
  }

  async save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  async findAllByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
  }

  async findById(id) {
    return this.documents.get(id) || null;
  }

  getFilePath(storageName) {
    if (path.basename(storageName) !== storageName) {
      throw new Error('Nome interno de arquivo inválido.');
    }
    return path.join(this.storageDir, storageName);
  }

  async fileExists(storageName) {
    try {
      await fs.access(this.getFilePath(storageName));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async removeFile(storageName) {
    await fs.rm(this.getFilePath(storageName), { force: true });
  }
}

module.exports = DocumentsRepository;