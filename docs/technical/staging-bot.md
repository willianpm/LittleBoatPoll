# 🧪 Bot de Homologação (Staging)

Guia completo para usar o bot secundário de testes em ambiente isolado.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Setup Inicial](#setup-inicial)
- [Executando o Bot Staging](#executando-o-bot-staging)
- [Checklist de Validação](#checklist-de-validação)
- [Troubleshooting](#troubleshooting)
- [Migração para Produção](#migração-para-produção)

---

## 🎯 Visão Geral

O bot de homologação permite testar funcionalidades "em loco" (no Discord real) sem afetar o bot de produção.

### Características

- ✅ **Mesmo código-fonte** - Zero duplicação
- ✅ **Dados isolados** - Staging usa `data/environments/staging/`, prod usa `data/environments/prod/`
- ✅ **Identidade separada** - Token/client ID próprios
- ✅ **Execução sob demanda** - Roda localmente apenas quando necessário
- ✅ **Comandos globais** - Mesma experiência de produção

### Quando Usar

- 🧪 Validar nova feature antes de publicar
- 🐛 Reproduzir bug em ambiente controlado
- 🔄 Testar fluxos completos ponta-a-ponta
- 📊 Validar persistência após restart
- 🔐 Verificar permissões e restrições

---

## ⚙️ Pré-requisitos

### 1. Criar Bot Secundário no Discord

1. Acesse https://discord.com/developers/applications
2. Clique em **"New Application"**
3. Nome sugerido: `LittleBoatPoll-Staging`
4. Vá em **Bot** → **Reset Token** → copie o token
5. Vá em **General Information** → copie o **Application ID**

### 2. Configurar Permissões

O bot staging precisa das mesmas permissões do bot de produção:

- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Add Reactions
- ✅ Read Message History
- ✅ Use Slash Commands

### 3. Convidar Bot para Servidor de Teste

**⚠️ RECOMENDADO: Use um servidor separado para staging**

URL de convite (substitua `CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=SEU_CLIENT_ID_STAGING&permissions=274877925376&scope=bot%20applications.commands
```

---

## 🚀 Setup Inicial

### 1. Criar Arquivo `.env.staging`

Crie o arquivo na raiz do projeto:

```env
# ═══════════════════════════════════════════════════════
# BOT DE STAGING (HOMOLOGAÇÃO)
# ═══════════════════════════════════════════════════════

APP_ENV=staging
INSTANCE_ID=staging-local

# Credenciais do bot staging (DIFERENTES do bot de produção)
TOKEN=seu_token_staging_aqui
CLIENT_ID=seu_client_id_staging_aqui

# Deploy automático na primeira execução
DEPLOY=true

# Debug ativado para staging
DEBUG=true

# Porta diferente para evitar conflito se rodar ambos
PORT=8001
```

### 2. Estrutura de Dados

O bot criará automaticamente os diretórios na primeira execução:

```
data/
└── environments/
    ├── prod/          # Dados do bot de produção
    │   ├── active-polls.json
    │   ├── draft-polls.json
    │   ├── mensalistas.json
    │   ├── role-bindings.json
    │   ├── criadores-internos.json
    │   └── historico-votacoes.json
    └── staging/       # Dados isolados do staging
        ├── active-polls.json
        ├── draft-polls.json
        ├── mensalistas.json
        ├── role-bindings.json
        ├── criadores-internos.json
        └── historico-votacoes.json
```

---

## ▶️ Executando o Bot Staging

### Método 1: Scripts NPM (Recomendado - Multiplataforma)

O projeto já vem com scripts configurados que funcionam em **Windows, Linux e Mac**:

**Iniciar bot staging:**

```bash
npm run start:staging
```

**Deploy de comandos em staging:**

```bash
npm run deploy:staging
```

**Iniciar bot de produção:**

```bash
npm start
```

---

### Método 2: Via Variável de Ambiente (Manual)

Se preferir definir manualmente a variável:

**Windows (PowerShell):**

```powershell
$env:APP_ENV="staging"; npm start
```

**Windows (CMD):**

```cmd
set APP_ENV=staging && npm start
```

**Linux/Mac:**

```bash
APP_ENV=staging npm start
```

---

### Método 3: Via Arquivo .env Específico

1. Renomeie `.env` para `.env.prod` (backup da produção)
2. Renomeie `.env.staging` para `.env`
3. Execute: `npm start`
4. Após os testes, reverta os arquivos

---

## 🔧 Como Funciona

O bot usa `cross-env` (multiplataforma) para definir `APP_ENV=staging`, que automaticamente carrega o arquivo `.env.staging` em vez do `.env` padrão. Isso garante isolamento total de credenciais e dados entre ambientes.

**Scripts já configurados no `package.json`:**

- `npm run start:staging` - Inicia bot staging
- `npm run deploy:staging` - Deploy de comandos em staging
- `npm start` - Inicia bot de produção

**Para migração de dados legados:**

- Execute: `node scripts/migrate-data.js` - Migra dados legados para `data/environments/prod/`

---

## ✅ Checklist de Validação

Use este checklist para validar funcionalidades antes de promover para produção.

### 1. Inicialização e Deploy

- [ ] Bot aparece online no servidor de teste
- [ ] Comandos são registrados corretamente
- [ ] Logs mostram `Ambiente: STAGING`
- [ ] Arquivos criados em `data/environments/staging/`

### 2. Comandos de Enquete

#### 2.1. Criar Enquete (`/poll`)

- [ ] Comando responde corretamente
- [ ] Mensagem da enquete é enviada no canal
- [ ] Reações automáticas são adicionadas
- [ ] Enquete aparece em `data/environments/staging/active-polls.json`

#### 2.2. Votar em Enquete

- [ ] Usuário comum pode votar
- [ ] Reação é registrada corretamente
- [ ] Respeita limite de votos (`maxVotos`)
- [ ] Remove votos excedentes automaticamente
- [ ] Mensalista recebe peso correto quando configurado

#### 2.3. Encerrar Enquete (`/encerrar` ou context menu)

- [ ] Apenas criadores/admins podem encerrar
- [ ] Resultado é exibido corretamente
- [ ] Contabiliza peso de mensalista se ativo
- [ ] Enquete é movida para histórico
- [ ] Arquivo `historico-votacoes.json` é atualizado

### 3. Sistema de Rascunhos

#### 3.1. Criar Rascunho (`/draft criar`)

- [ ] Rascunho é criado com sucesso
- [ ] Salvo em `data/environments/staging/draft-polls.json`
- [ ] ID é gerado corretamente

#### 3.2. Listar Rascunhos (`/draft listar`)

- [ ] Exibe apenas rascunhos do ambiente staging
- [ ] Informações estão corretas (criador, data, opções)

#### 3.3. Publicar Rascunho (`/draft publicar`)

- [ ] Rascunho é convertido em enquete ativa
- [ ] Removido da lista de rascunhos
- [ ] Enquete funciona normalmente

#### 3.4. Excluir Rascunho (`/draft excluir`)

- [ ] Rascunho é removido
- [ ] Arquivo é atualizado corretamente

### 4. Permissões

#### 4.1. Criadores de Enquete

- [ ] `/criador-de-enquete adicionar` funciona
- [ ] Novo criador é salvo em `criadores-internos.json` (staging)
- [ ] Criador pode executar comandos restritos
- [ ] `/criador-de-enquete listar` exibe lista correta
- [ ] Context menu "Add/Del Criador" funciona

#### 4.2. Mensalistas

- [ ] `/mensalista adicionar` funciona
- [ ] Mensalista recebe peso 2 quando ativo
- [ ] Vínculo com cargo do Discord funciona (se configurado)
- [ ] `/mensalista listar` exibe lista correta

### 5. Persistência e Recuperação

- [ ] Parar o bot (`Ctrl+C`)
- [ ] Reiniciar o bot staging
- [ ] Enquetes ativas são restauradas
- [ ] Rascunhos são restaurados
- [ ] Reações sincronizam corretamente
- [ ] Votos são mantidos

### 6. Edge Cases

- [ ] Tentar votar além do limite → reação removida + DM
- [ ] Usuário sem permissão tenta criar enquete → bloqueado
- [ ] Mensagem de enquete deletada manualmente → marcada como órfã
- [ ] Remover última reação → voto removido do registro
- [ ] Múltiplos votos simultâneos → todos registrados

### 7. Observabilidade

- [ ] Logs estruturados mostram `env=staging`
- [ ] Erros são capturados e exibidos
- [ ] Debug mode mostra logs detalhados
- [ ] Keep-alive HTTP responde `[STAGING]`

---

## 🐛 Troubleshooting

### Problema: "Invalid Token"

**Causa:** Token incorreto ou não configurado.

**Solução:**

1. Verifique se `TOKEN` está correto no `.env.staging`
2. Regenere o token no Discord Developer Portal se necessário
3. Certifique-se de que não há espaços extras

---

### Problema: Comandos não aparecem

**Causa:** Deploy não foi executado.

**Solução:**

```bash
APP_ENV=staging DEPLOY=true npm start
```

Aguarde "Deploy concluído com sucesso" antes de testar.

---

### Problema: Dados de produção são alterados

**Causa:** `APP_ENV` não foi definido, bot rodou em modo `prod` por padrão.

**Solução:**

1. Restaure backup de `data/environments/prod/` (se houver)
2. Sempre confirme que os logs mostram `Ambiente: STAGING` na inicialização
3. Use script `npm run start:staging` para evitar erro humano

---

### Problema: Bot offline no servidor

**Causa:** O bot staging roda localmente sob demanda.

**Solução:**

- Normal! O bot só fica online enquanto você roda localmente
- Se precisar staging 24/7, considere hospedagem separada

---

### Problema: Arquivos JSON corrompidos

**Causa:** Escrita concorrente ou erro manual.

**Solução:**

1. Pare o bot
2. Valide JSON com `npx jsonlint data/environments/staging/arquivo.json`
3. Restaure de backup ou corrija manualmente
4. Reinicie o bot

---

## 🚀 Migração para Produção

Após validar no staging, siga este processo para publicar em produção:

### 1. Validação Final

- [ ] Todos os itens do checklist passaram
- [ ] Testes automatizados (`npm test`) passam
- [ ] Sem erros no console staging
- [ ] Feature foi testada por outra pessoa (se possível)

### 2. Commit e Push

```bash
git add .
git commit -m "feat: [descrição da feature]"
git push origin main
```

### 3. Deploy em Produção

Se bot de produção roda localmente:

```bash
git pull origin main
npm install  # Se houver novas dependências
npm start
```

Se bot roda em servidor (Koyeb, Heroku, etc.):

1. Push para branch principal
2. Aguarde deploy automático
3. Monitore logs de produção

### 4. Validação em Produção

- [ ] Bot reinicia sem erros
- [ ] Comandos continuam funcionando
- [ ] Dados anteriores são mantidos
- [ ] Nova feature funciona como esperado

### 5. Rollback (se necessário)

Se algo der errado em produção:

```bash
git revert HEAD
git push origin main
```

Ou reverta para commit anterior estável:

```bash
git reset --hard <commit_hash>
git push --force origin main
```

---

## 📊 Boas Práticas

### Desenvolvimento

- ✅ **Sempre teste no staging antes de produção**
- ✅ Use `DEBUG=true` no staging para logs detalhados
- ✅ Mantenha servidor de staging separado do de produção
- ✅ Documente mudanças no CHANGELOG.md

### Operação

- ✅ Faça backup de `data/environments/prod/` regularmente
- ✅ Não confie 100% em staging - bugs podem surgir apenas em prod
- ✅ Monitore logs de produção após deploy
- ✅ Tenha plano de rollback sempre pronto

### Segurança

- ❌ **NUNCA** compartilhe token do bot de produção
- ❌ **NUNCA** commit arquivo `.env` ou `.env.staging`
- ❌ **NUNCA** use token de produção em staging
- ✅ Rotacione tokens periodicamente

---

## 🔗 Referências

- [Setup Discord](./setup-discord.md)
- [Documentação de Permissões](./MIGRACAO-PERMISSOES-INTERNAS.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [README.md](../README.md)

---

## 💬 Suporte

Se encontrar problemas não cobertos por este guia:

1. Verifique logs com `DEBUG=true`
2. Consulte [troubleshooting.md](./troubleshooting.md)
3. Abra issue no GitHub com:
   - Ambiente (staging/prod)
   - Passos para reproduzir
   - Logs relevantes
   - Comportamento esperado vs real

---

**Última atualização:** 27/02/2026
