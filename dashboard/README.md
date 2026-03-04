# Dashboard Backend Integration (Feature #16)

Esta pasta contém os serviços e controllers necessários para integração backend do Dashboard com o bot, conforme arquitetura planejada.

## Estrutura

- `services/csvService.js`: Parsing, validação e conversão de CSV para JSON.
- `services/botService.js`: Escrita segura de JSON para o bot.
- `controllers/csvController.js`: Endpoint para upload e processamento de CSV.

## Contratos

- `csvService.parseAndValidate(filePath)` → `{ valid, data, error }`
- `botService.savePoll(jsonData)` → `Promise<void>`
- `csvController.uploadCsv(req, res)` → Processa upload e salva JSON

## Pontos de Integração

- O frontend do Dashboard (#15) deve consumir o endpoint de upload e os serviços expostos.
- Não duplicar lógica de conversão/validação no Dashboard.
- Toda comunicação com o bot é feita via arquivos JSON.

## Testes e Mocks

- Os serviços podem ser testados isoladamente.
- Funções mock (`csvService.mock.js`, `botService.mock.js`) podem ser usadas para simular integração enquanto o frontend não está pronto. Basta importar o mock no lugar do serviço real para testes ou desenvolvimento paralelo.

## Observações

- Todos os serviços e controllers possuem tratamento de erros e logs para facilitar depuração e integração.
- Não dependa de código ainda inexistente do Dashboard.
- Documente qualquer alteração de contrato para evitar conflitos futuros.
