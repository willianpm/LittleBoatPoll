# Dashboard (Backend + Frontend)

Esta pasta contém a implementação completa do dashboard administrativo do bot:

- backend de integração (`api/`, `controllers/`, `services/`)
- frontend React + Vite (`frontend/`)
- autenticação via Discord OAuth2 (sessão HttpOnly)

## Autenticação

O acesso ao dashboard é feito por login com Discord:

1. frontend redireciona para `GET /api/auth/discord/login`
2. callback OAuth em `GET /api/auth/discord/callback`
3. sessão é mantida por cookie HttpOnly (`dashboard.sid`)
4. APIs protegidas exigem sessão válida e permissão de Criador/Admin/Dono

### Endpoints de auth

- `GET /api/auth/discord/login`
- `GET /api/auth/discord/callback`
- `GET /api/auth/me`
- `GET /api/auth/guilds` (lista servidores acessíveis ao usuário autenticado)
- `GET /api/auth/guilds/:guildId/members?query=`
- `GET /api/auth/guilds/:guildId/channels`
- `POST /api/auth/logout`

## Endpoints de negócio

### Upload CSV

- **Endpoint:** `POST /api/csv/upload`
- **Auth:** sessão autenticada (cookie)
- **Content-Type:** `multipart/form-data`
- **Campo obrigatório:** `file`

Resposta de sucesso:

```json
{
  "success": true
}
```

### Execução de comandos

- **Endpoint:** `POST /api/commands/:commandName`
- **Auth:** sessão autenticada (cookie)
- **Content-Type:** `application/json`

Payload mínimo:

```json
{
  "commandType": 1,
  "options": {},
  "guild": { "id": "123" },
  "target": {}
}
```

### Catálogo e alvos visuais

- `GET /api/commands/catalog` — Lista todos os comandos disponíveis do bot (slash + contexto), incluindo metadados para renderização da UI.
- `GET /api/commands/context-targets/polls?guildId=...` — Retorna enquetes ativas para seleção visual em comandos contextuais de mensagem.
- `GET /api/commands/context-targets/drafts` — Retorna rascunhos disponíveis para seleção visual do ID em ações de `/rascunho`.

## Formato do CSV

Delimitador obrigatório: `;`

Colunas obrigatórias (nesta ordem):

1. `nome-da-enquete`
2. `opções`
3. `max_votos`
4. `peso_mensalistas`

Exemplo:

```csv
nome-da-enquete;opções;max_votos;peso_mensalistas
Enquete 1;Opção A,Opção B;2;sim
Enquete 2;Opção X,Opção Y,Opção Z;1;nao
```

## Frontend

Dentro de `dashboard/frontend`:

```bash
npm install
npm run dev
npm run build
```

No build de produção, os arquivos gerados são servidos pelo Express principal.

### Fluxo UX atual

O dashboard de comandos segue fluxo guiado por seleção visual:

1. seleção de servidor por cards
2. seleção de comando em catálogo visual (slash + contexto)
3. abertura automática do formulário específico do comando/subcomando

Campos manuais de `Guild ID` e `Permissões (separadas por vírgula)` foram removidos da interface.

## Variáveis de ambiente (dashboard)

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_OAUTH_REDIRECT_URI=...
DASHBOARD_SESSION_SECRET=...
DASHBOARD_ALLOWED_GUILD_ID=...
```

Consulte `INTEGRATION_GUIDE.md` para detalhes adicionais de integração e testes.
