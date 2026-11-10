# Especificacao - Document Management System

## 1. Objetivo

Definir a fase inicial de um sistema web para enviar, listar e baixar documentos armazenados localmente, com metadados mantidos em memoria e atribuicao a um proprietario logico.

> **Estado atual:** o backend existente expoe somente `GET /health`. Upload, listagem, download e a interface correspondente ainda nao estao implementados. Os contratos abaixo especificam o comportamento esperado para esta fase.

## 2. Escopo

### Dentro do escopo

- Receber um documento por requisicao.
- Gravar o arquivo no filesystem local, em `backend/storage`, usando `multer` com `diskStorage`.
- Manter os metadados dos documentos em memoria enquanto o processo estiver em execucao.
- Listar os metadados dos documentos disponiveis para o proprietario logico da fase inicial.
- Baixar um documento pelo identificador, sem expor o caminho interno de armazenamento.
- Oferecer uma interface React para upload, listagem e download, consumindo a API com `fetch`.
- Permitir configuracao operacional por variaveis de ambiente.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistencia duravel de metadados.
- Versionamento de documentos.
- Autenticacao, autorizacao confiavel, cadastro de usuarios ou isolamento seguro entre usuarios.
- Visualizacao ou edicao do conteudo dos documentos.
- Exclusao de documentos, busca avancada ou compartilhamento.
- Garantia de recuperacao dos metadados apos reinicio do processo.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado pelo campo multipart `file`. |
| RF-02 | O sistema deve gerar um identificador unico para cada documento e armazenar o arquivo com um nome interno que nao dependa do nome fornecido pelo cliente. |
| RF-03 | O sistema deve registrar `id`, `originalName`, `size`, `uploadedAt` e `owner` para cada upload concluido. |
| RF-04 | O sistema deve listar documentos em formato JSON, sem incluir caminhos internos ou conteudo binario. |
| RF-05 | O sistema deve permitir baixar um documento existente por identificador, como anexo e sem renderizar seu conteudo inline. |
| RF-06 | O sistema deve rejeitar requisicoes invalidas com respostas HTTP apropriadas e mensagens de erro estaveis. |
| RF-07 | O sistema deve atribuir os documentos ao proprietario logico definido para a fase inicial. Essa atribuicao nao equivale a autenticacao nem a isolamento seguro entre usuarios. |
| RF-08 | O endpoint existente `GET /health` deve continuar respondendo com o estado de saude do servico. |

## 4. Requisitos nao funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local, dentro de `backend/storage` por padrao, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados devem residir em memoria no processo do backend. |
| RNF-03 | Configuracoes operacionais, como porta, diretorio de armazenamento e limite de upload, devem ser obtidas por variaveis de ambiente, com valores padrao documentados. |
| RNF-04 | O nome original do arquivo nao deve ser usado como caminho de gravacao nem permitir traversal de diretorios. |
| RNF-05 | O download deve localizar o arquivo usando o identificador e o nome interno controlado pela aplicacao, nunca um caminho enviado pelo cliente. |
| RNF-06 | Erros internos nao devem expor stack traces, caminhos locais ou detalhes da implementacao nas respostas HTTP. |
| RNF-07 | A API deve responder de forma consistente em JSON para respostas de sucesso e erro, exceto pelo conteudo binario do download. |
| RNF-08 | O frontend deve acessar a API pelo prefixo `/api`; no desenvolvimento, o proxy existente do Vite remove esse prefixo antes de encaminhar a requisicao ao backend. |

### Limites de durabilidade e disponibilidade

Os arquivos persistem no diretorio local, mas os metadados existem somente enquanto o processo estiver ativo. Apos reinicio, os arquivos podem permanecer no disco, porem nao estarao necessariamente registrados nem disponiveis pela API. A fase inicial nao inclui recuperacao automatica desses metadados nem limpeza automatica de arquivos orfaos.

## 5. Modelo de dados (metadados do documento)

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | string | Identificador unico, preferencialmente UUID, gerado pelo servidor. |
| `originalName` | string | Nome original fornecido no upload, tratado como texto de apresentacao e nunca como caminho de armazenamento. |
| `size` | number | Tamanho do arquivo em bytes, informado pelo processamento do upload no servidor. |
| `uploadedAt` | string | Data e hora do upload concluido em formato ISO 8601 UTC. |
| `owner` | string | Identificador do proprietario logico ao qual o documento foi atribuido. |

Na fase inicial, sem autenticacao ou contexto de usuario confiavel, `owner` representa um unico proprietario logico padrao, por exemplo, `local-user`. Nao deve ser interpretado como identidade verificada. Nao se deve confiar em um valor de proprietario enviado livremente pelo cliente para fornecer isolamento entre usuarios.

O registro tambem pode manter internamente um nome de arquivo gerado pelo servidor para localizar o conteudo. Esse valor e detalhe de persistencia: nao deve ser retornado pela API nem derivado de entrada nao confiavel.

## 6. Contratos de API

Os caminhos abaixo sao os caminhos recebidos pelo backend. O frontend usa o prefixo `/api` durante o desenvolvimento, e o proxy Vite existente o remove: por exemplo, `/api/documents` e encaminhado como `/documents`.

### Formato comum de erro

Respostas de erro JSON devem seguir este formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento nao encontrado."
  }
}
```

`code` deve ser estavel para uso pelo frontend. `message` deve ser uma descricao segura e adequada para exibicao. Erros internos nao devem incluir detalhes tecnicos sensiveis.

### POST `/upload`

Envia um documento.

**Entrada**

- `Content-Type: multipart/form-data`
- Campo obrigatorio: `file`, contendo exatamente um arquivo.
- Nao sao aceitos caminhos, identificadores, tamanho ou proprietario definidos pelo cliente como fonte de verdade.
- Nesta fase, nao ha allowlist de extensoes ou tipos MIME; o conteudo e tratado como arquivo opaco e servido como anexo.

**Validacoes**

- A requisicao deve ser `multipart/form-data`.
- O campo `file` deve existir e conter um arquivo nao vazio.
- O tamanho maximo deve ser limitado. Valor padrao recomendado: `10 MiB`, configuravel por `MAX_FILE_SIZE_BYTES`.
- O nome original deve ser tratado com seguranca e nao pode influenciar o caminho ou nome interno do arquivo.
- Falhas durante a gravacao nao devem deixar um registro de metadados que pareca concluido.

**Sucesso**

- `201 Created`
- `Content-Type: application/json`

```json
{
  "document": {
    "id": "8a54e8ca-e71c-4c89-b28b-286ef7b0b4d2",
    "originalName": "relatorio.pdf",
    "size": 48231,
    "uploadedAt": "2026-11-10T12:30:00.000Z",
    "owner": "local-user"
  }
}
```

**Erros**

| Status | Codigo | Condicao |
| --- | --- | --- |
| `400` | `INVALID_MULTIPART` | Requisicao multipart ausente ou malformada. |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou sem arquivo. |
| `413` | `FILE_TOO_LARGE` | Arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `500` | `UPLOAD_FAILED` | Falha inesperada ao gravar o arquivo ou registrar seus metadados. |

### GET `/documents`

Lista os documentos do proprietario logico atual.

**Entrada**

- Sem corpo.
- Nesta fase, nao ha parametro de paginacao nem filtro por usuario.
- Como o proprietario e unico e nao autenticado, a listagem nao representa isolamento de dados entre usuarios.

**Sucesso**

- `200 OK`
- `Content-Type: application/json`
- A lista deve ser ordenada por `uploadedAt` decrescente. Se estiver vazia, deve retornar um array vazio.

```json
{
  "documents": [
    {
      "id": "8a54e8ca-e71c-4c89-b28b-286ef7b0b4d2",
      "originalName": "relatorio.pdf",
      "size": 48231,
      "uploadedAt": "2026-11-10T12:30:00.000Z",
      "owner": "local-user"
    }
  ]
}
```

**Erros**

| Status | Codigo | Condicao |
| --- | --- | --- |
| `500` | `DOCUMENT_LIST_FAILED` | Falha inesperada ao consultar o repositorio em memoria. |

### GET `/documents/:id/download`

Baixa o conteudo de um documento existente.

**Entrada**

- Parametro `id`: identificador gerado pelo servidor.
- Sem corpo.

**Validacoes**

- O identificador deve ter o formato adotado pelo sistema.
- O arquivo deve ser localizado exclusivamente por meio do identificador e do registro interno; o cliente nao pode fornecer caminhos.
- A resposta deve usar `Content-Disposition: attachment` e nao deve renderizar o conteudo inline.
- O tipo de conteudo pode ser `application/octet-stream`.

**Sucesso**

- `200 OK`
- Corpo binario do arquivo.
- Cabecalho `Content-Disposition` com o nome original tratado com seguranca.

**Erros**

| Status | Codigo | Condicao |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | Identificador malformado. |
| `404` | `DOCUMENT_NOT_FOUND` | Nao existe metadado para o identificador informado. |
| `404` | `DOCUMENT_FILE_NOT_FOUND` | Ha metadado, mas o arquivo correspondente nao esta disponivel no disco. |
| `500` | `DOWNLOAD_FAILED` | Falha inesperada ao ler ou transmitir o arquivo. |

### GET `/health` (existente)

- `200 OK`

```json
{
  "status": "ok"
}
```

Este endpoint ja existe no seed do backend e nao substitui os contratos funcionais de documentos.

## 7. Decisoes arquiteturais

- Backend em Node.js, Express e CommonJS, mantendo o fluxo `routes -> controllers -> services -> repositories`.
- `routes` definem os caminhos e encaminham as requisicoes; `controllers` tratam entrada HTTP, validacoes de borda e respostas; `services` concentram regras do fluxo de documentos; `repositories` mantem os metadados em memoria e coordenam o acesso aos arquivos locais.
- `multer` com `diskStorage` e o mecanismo de recebimento e gravacao. O destino padrao e `backend/storage`; nenhum armazenamento externo deve ser utilizado.
- O nome interno do arquivo deve ser gerado pelo servidor e nao deve depender do nome original. O caminho de armazenamento nao e parte da API publica.
- O repositorio de metadados e temporario e em memoria. A gravacao do arquivo e o registro de metadados devem ser tratados como uma unica operacao logica: se o registro falhar apos a gravacao, remover o arquivo recem-criado quando possivel.
- O identificador de proprietario na fase inicial e um valor logico unico, nao uma credencial. Autenticacao, autorizacao e isolamento real entre usuarios ficam para uma fase futura.
- Frontend em React + Vite, com componentes funcionais e Hooks, comunicacao via `fetch` pelo prefixo `/api` e reaproveitamento do proxy existente do Vite.
- Configuracoes recomendadas: `PORT` com padrao `3000` (ja utilizado pelo backend), `STORAGE_DIR` com padrao `backend/storage` e `MAX_FILE_SIZE_BYTES` com padrao de `10485760`.
- O limite de tamanho e o diretorio devem ser validados na inicializacao ou no processamento, com falhas reportadas sem expor detalhes sensiveis.
- Risco conhecido: apos reinicio, o estado em memoria e perdido enquanto arquivos podem permanecer no diretorio local. A fase inicial documenta esse limite, sem introduzir banco de dados ou indexacao persistente.

## 8. Plano de execucao

1. **Consolidar os contratos da fase inicial**
   - Confirmar o modelo de metadados, os limites de upload, os formatos de resposta e os codigos de erro.
   - Criterio de aceite: os tres endpoints funcionais e as limitacoes de identidade e durabilidade estao descritos sem pressupor autenticacao implementada.

2. **Implementar o fluxo de backend**
   - Construir as responsabilidades de rotas, controllers, services e repositories para upload, listagem e download.
   - Manter arquivos no filesystem local por `multer` com `diskStorage` e metadados em memoria.
   - Criterio de aceite: os contratos HTTP desta especificacao sao atendidos; caminhos fornecidos pelo cliente nao controlam o armazenamento ou o download; `/health` continua funcionando.

3. **Implementar a interface**
   - Disponibilizar os fluxos de envio, listagem e download usando React, Hooks e chamadas `fetch` via `/api`.
   - Apresentar estados de carregamento, sucesso, lista vazia e erro sem depender de autenticacao inexistente.
   - Criterio de aceite: um arquivo pode ser enviado, aparece na listagem e pode ser baixado pela interface.

4. **Validar os fluxos integrados**
   - Cobrir casos de sucesso e falha de upload, listagem e download, alem do limite de tamanho e dos erros de identificador e arquivo ausente.
   - Verificar a integracao pelo proxy do Vite e a configuracao por variaveis de ambiente.
   - Criterio de aceite: os testes do backend passam, o frontend compila e a validacao manual confirma o fluxo completo de envio, listagem e download.