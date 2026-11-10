async function readError(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a operação.';
  } catch {
    return 'Não foi possível concluir a operação.';
  }
}

export async function listDocuments() {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = await response.json();
  return body.document;
}

export async function downloadDocument(id, originalName) {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const fileUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = originalName || 'document';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}