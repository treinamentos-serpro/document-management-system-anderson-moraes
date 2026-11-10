import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documents.js';
import { formatFileSize } from '../utils/fileFormatting.js';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setMessage(null);
    try {
      await uploadDocument(file);
      setMessage({ type: 'success', text: 'Arquivo enviado.' });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploaded?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
    setMessage(null);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`upload-dropzone${file ? ' has-file' : ''}`} htmlFor="document-file">
        <span className="upload-symbol" aria-hidden="true">+</span>
        <span className="upload-prompt">
          <strong>{file ? file.name : 'Escolher um arquivo'}</strong>
          <small>{file ? formatFileSize(file.size) : 'Selecione do seu dispositivo'}</small>
        </span>
        <input
          ref={inputRef}
          id="document-file"
          name="file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
      <button className="upload-submit" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        <span aria-hidden="true">↗</span>
      </button>
      {message && (
        <p className={`form-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
      <p className="upload-note">Os arquivos são mantidos neste dispositivo.</p>
    </form>
  );
}