---
description: Gera testes com node:test para um módulo do backend, incluindo caminhos de erro.
name: gerar-testes-unitarios
argument-hint: caminho do modulo (ex. backend/src/services/documents.service.js)
agent: agent
---

# Gerar testes do backend

Gere testes automatizados para o módulo `${input:modulo:caminho do modulo}` usando o runner nativo `node:test` e `node:assert`.

Requisitos:

- Antes de escrever os testes, inspecione o módulo e suas dependências diretas para identificar entradas, resultados, efeitos colaterais e caminhos de erro observáveis.
- Cubra os casos de sucesso, validações inválidas e todos os pontos de exceção alcançáveis no módulo: erros lançados ou rejeitados por dependências e falhas de filesystem/rede somente quando fizerem parte do comportamento do módulo.
- Para cada caminho de erro, verifique o resultado observável esperado, como erro propagado ou tratado, status HTTP, mensagem e efeitos colaterais. Não teste detalhes internos que não façam parte do contrato.
- Mantenha os testes independentes, legíveis e determinísticos. Isole dependências com stubs ou mocks simples quando apropriado; não altere estado compartilhado entre testes.
- Coloque ou atualize os testes em `backend/test`, seguindo o estilo existente. Não crie testes duplicados para comportamentos já cobertos.
- Não dependa de serviços externos nem adicione dependências. Para testes que precisem de arquivos, use diretórios temporários e remova-os ao final, inclusive quando o teste falhar.
- Ao terminar, execute `npm test --prefix backend` e corrija falhas causadas pelos testes adicionados. Informe brevemente os arquivos alterados e o resultado da execução.