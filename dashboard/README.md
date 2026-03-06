# Dashboard Backend Integration (Feature #16)

Esta pasta contém os serviços e controllers necessários para integração backend do Dashboard com o bot, conforme arquitetura planejada.

## Estrutura

- `services/csvService.js`: Parsing, validação e conversão de CSV para JSON.
- `services/botService.js`: Escrita segura de JSON para o bot.
- `controllers/csvController.js`: Endpoint para upload e processamento de CSV.

## Formato do CSV

O CSV entregue pelo frontend deve seguir esta especificação:

### Estrutura Obrigatória

**Delimitador:** ponto e vírgula (`;`)

**Colunas obrigatórias** (exatamente estas 4 colunas, nesta ordem):

1. `nome-da-enquete` - Texto do título da enquete
2. `opções` - Opções separadas por vírgula, barra ou pipe (`,` `|` `/`)
3. `max_votos` - Número inteiro positivo (quantidade máxima de votos por usuário)
4. `peso_mensalistas` - `sim` ou `nao` (se deve aplicar peso para mensalistas)

### Exemplo de CSV Válido

```csv
nome-da-enquete;opções;max_votos;peso_mensalistas
Enquete 1;Opção A,Opção B;2;sim
Enquete 2;Opção X,Opção Y,Opção Z;1;nao
Melhor filme;Star Wars,Matrix,Senhor dos Anéis;1;sim
```

## Diagrama do Payload do CSV

```
{
- `api/dashboard-commands.js`: Rota HTTP para execução de comandos do bot (`POST /api/commands/:commandName`)
- `api/dashboard-csv.js`: Rota HTTP para upload de CSV (`POST /api/csv/upload`) com middleware multer
- `services/csvService.js`: Parsing, validação e conversão de CSV para JSON.
- `services/botService.js`: Escrita segura de JSON para o bot.
- `controllers/csvController.js`: Controller para upload e processamento de CSV.
- `controllers/csvController.test.js`: Testes unitários do csvController
- `tests/dashboard-csv.test.js`: Testes de integração da rota HTTP de CSV
- `tests/dashboard-commands.test.js`: Testes de integração da rota HTTP de comandos
  "peso_mensalistas": "sim" | "nao"
}
```

Consulte `INTEGRATION_GUIDE.md` para detalhes sobre integração de comandos do bot via dashboard.

## Endpoints HTTP

### 1. Upload de CSV

**Endpoint:** `POST /api/csv/upload`

**Autenticação:** Bearer token (via header)

**Content-Type:** `multipart/form-data`

**Exemplo com cURL:**

```bash
curl -X POST http://localhost:3000/api/csv/upload \
  -H "Authorization: Bearer seu-token" \
  -F "file=@enquetes.csv"
```

**Resposta de sucesso:**

```json
{
  "success": true
}
```

### 2. Execução de Comandos

**Endpoint:** `POST /api/commands/:commandName`

**Autenticação:** Bearer token (via header)

**Content-Type:** `application/json`

**Exemplo:**

```bash
curl -X POST http://localhost:3000/api/commands/poll \
  -H "Authorization: Bearer seu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "options": {"title": "Minha enquete"},
    "user": {"id": "123", "username": "user"},
    "guild": {"id": "456"},
    "member": {"id": "123"},
    "permissions": []
  }'
```

Consulte `INTEGRATION_GUIDE.md` para detalhes completos sobre ambos os endpoints.
