const path = require('node:path');

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

module.exports = { getSafeOriginalName, toPublicDocument };