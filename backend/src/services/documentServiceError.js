class DocumentServiceError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'DocumentServiceError';
    this.code = code;
    this.status = status;
  }
}

module.exports = DocumentServiceError;