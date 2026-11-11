const { test } = require('node:test');
const assert = require('node:assert/strict');
const DocumentsService = require('../src/services/documents.service');
const DocumentServiceError = require('../src/services/documentServiceError');

function createRepository(overrides = {}) {
  return {
    save: async (document) => document,
    removeFile: async () => {},
    ...overrides,
  };
}

test('create salva os metadados e retorna apenas os campos públicos', async () => {
  let savedDocument;
  const service = new DocumentsService(createRepository({
    save: async (document) => {
      savedDocument = document;
    },
  }));

  const result = await service.create({
    filename: 'stored-file-id',
    originalname: '../relatorio.txt',
    size: 12,
  });

  assert.equal(result.originalName, 'relatorio.txt');
  assert.equal(result.size, 12);
  assert.equal(result.owner, 'local-user');
  assert.equal(savedDocument.storageName, 'stored-file-id');
  assert.deepEqual(Object.keys(result).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
});

test('create remove o arquivo e rejeita arquivo vazio', async () => {
  let removedFilename;
  const service = new DocumentsService(createRepository({
    removeFile: async (filename) => {
      removedFilename = filename;
    },
  }));

  await assert.rejects(
    service.create({ filename: 'empty-file-id', originalname: 'empty.txt', size: 0 }),
    (error) => error instanceof DocumentServiceError && error.code === 'FILE_REQUIRED',
  );
  assert.equal(removedFilename, 'empty-file-id');
});

test('create remove o arquivo e traduz falha ao salvar metadados', async () => {
  let removedFilename;
  const service = new DocumentsService(createRepository({
    save: async () => {
      throw new Error('repository failure');
    },
    removeFile: async (filename) => {
      removedFilename = filename;
    },
  }));

  await assert.rejects(
    service.create({ filename: 'orphan-file-id', originalname: 'report.txt', size: 5 }),
    (error) => error instanceof DocumentServiceError && error.code === 'UPLOAD_FAILED',
  );
  assert.equal(removedFilename, 'orphan-file-id');
});