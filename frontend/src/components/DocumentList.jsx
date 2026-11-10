import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/fileFormatting.js';

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading) {
    return <p className="list-state" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-state list-error" role="alert">
        <span>{error}</span>
        <button type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento ainda.</p>
      </div>
    );
  }

  return (
    <div className="document-table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <div className="file-name-cell">
                  <span className="file-type-mark" aria-hidden="true">DOC</span>
                  <span className="file-name" title={document.originalName}>{document.originalName}</span>
                </div>
              </td>
              <td className="table-secondary">{formatFileSize(document.size)}</td>
              <td className="table-secondary">{formatDate(document.uploadedAt)}</td>
              <td className="table-action"><DownloadButton document={document} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}