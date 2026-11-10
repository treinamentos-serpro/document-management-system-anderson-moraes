const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const appModule = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(appModule, 'o app deve estar definido');
  assert.equal(typeof appModule, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async (t) => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-storage-'));
  const app = appModule.createApp({ storageDir, maxFileSizeBytes: 8 });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  const invalidMultipartResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(invalidMultipartResponse.status, 400);
  assert.equal((await invalidMultipartResponse.json()).error.code, 'INVALID_MULTIPART');

  const malformedMultipartResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=dms-boundary' },
    body: 'not a multipart payload',
  });
  assert.equal(malformedMultipartResponse.status, 400);
  assert.equal((await malformedMultipartResponse.json()).error.code, 'INVALID_MULTIPART');

  const emptyFormResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(emptyFormResponse.status, 400);
  assert.equal((await emptyFormResponse.json()).error.code, 'FILE_REQUIRED');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['123456789']), 'too-large.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: oversizedForm,
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');

  const uploadForm = new FormData();
  uploadForm.append('file', new Blob(['hello']), 'hello.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
  });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.equal(document.originalName, 'hello.txt');
  assert.equal(document.size, 5);
  assert.equal(document.owner, 'local-user');

  const storedFiles = await fs.readdir(storageDir);
  assert.equal(storedFiles.length, 1);
  assert.notEqual(storedFiles[0], 'hello.txt');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /^attachment;/);
  assert.equal(await downloadResponse.text(), 'hello');

  const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`);
  assert.equal(invalidIdResponse.status, 400);
  assert.equal((await invalidIdResponse.json()).error.code, 'INVALID_DOCUMENT_ID');

  const missingDocumentResponse = await fetch(`${baseUrl}/documents/8a54e8ca-e71c-4c89-b28b-286ef7b0b4d2/download`);
  assert.equal(missingDocumentResponse.status, 404);
  assert.equal((await missingDocumentResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
