import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documents.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError('');
    listDocuments()
      .then((items) => {
        if (isCurrent) setDocuments(items);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS<span> / </span>Arquivo</span>
        </a>
        <div className="topbar-meta">
          <span className="storage-indicator"><span />Armazenamento local</span>
          <span className="user-mark" aria-label="Usuário local">L</span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO</p>
            <h1>Documentos</h1>
          </div>
          <div className="document-total" aria-live="polite">
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="upload-section" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar arquivo</h2>
            </div>
            <UploadComponent onUploaded={() => setRefreshKey((key) => key + 1)} />
          </section>

          <section className="documents-section" aria-labelledby="documents-heading">
            <div className="section-heading document-list-heading">
              <div className="section-title-group">
                <span className="section-index">02</span>
                <h2 id="documents-heading">Seus arquivos</h2>
              </div>
              <button
                className="refresh-button"
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                aria-label="Atualizar lista de documentos"
                title="Atualizar lista"
              >
                ↻
              </button>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              error={error}
              onRetry={() => setRefreshKey((key) => key + 1)}
            />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <span>DMS</span>
        <span>Área pessoal <i /></span>
      </footer>
    </div>
  );
}
