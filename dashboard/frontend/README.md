# Frontend Dashboard

Frontend React + Vite para o dashboard administrativo do Little Boat Poll.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Integração

- Login: `/api/auth/discord/login`
- Sessão: `/api/auth/me`
- Logout: `/api/auth/logout`
- Upload CSV: `/api/csv/upload`
- Comandos: `/api/commands/:commandName`

Em desenvolvimento local, o Vite faz proxy de `/api` para `http://localhost:8000`.
