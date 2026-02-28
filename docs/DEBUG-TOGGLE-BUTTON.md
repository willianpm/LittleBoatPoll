# 🐛 Debug: Problema com Toggle Button e Criadores de Enquete

## 🎯 Objetivo

Identificar por que usuários com cargo "Criador de Enquete" não conseguem usar comandos de contexto (toggle buttons).

---

## ✅ Mudanças Implementadas

### 1. **Logs Detalhados no Sistema de Permissões**

Adicionados logs completos em:
- `utils/permissions.js` → função `isCriador()`
- `utils/permissions.js` → função `hasAuthorizedAdminRole()`

Agora o console mostrará:
- ✅ ID e nome do usuário tentando executar comando
- ✅ Se é administrador ou dono do servidor
- ✅ Se está na lista de criadores internos
- ✅ Quais cargos o usuário possui
- ✅ Quais cargos são autorizados
- ✅ Por que a permissão foi negada (se for o caso)

### 2. **Comando de Debug**

Novo comando: `/debug-permissoes`

**Uso:**
```
/debug-permissoes
/debug-permissoes usuario:@fulano
```

**Mostra:**
- Permissões do Discord (Admin, Dono)
- Status no sistema interno (Criador de Enquete?)
- Cargos do usuário
- Cargos autorizados configurados
- Resultado final da verificação

### 3. **Script de Teste Automatizado**

Arquivo: `test-bot/test-permissions-debug.js`

**Executa:**
- Conecta ao servidor de teste
- Busca usuário específico
- Verifica configurações nos arquivos JSON
- Simula verificação de permissões
- Mostra recomendações se falhar

---

## 🧪 Como Testar

### **Opção 1: Teste Rápido (Recomendado)**

1. **Suba o bot normalmente:**
   ```bash
   npm start
   ```

2. **No Discord, execute:**
   ```
   /debug-permissoes
   ```

3. **Observe o console do bot** - ele mostrará logs detalhados:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 [PERMISSION CHECK] isCriador iniciado
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   👤 Usuário: SeuNome#1234
   🆔 User ID: 300728666042662912
   🏰 Guild ID: 1328140418055012383
   ...
   ```

### **Opção 2: Teste com Comando de Contexto Real**

1. **Suba o bot:**
   ```bash
   npm start
   ```

2. **No Discord, clique direito em uma mensagem** → `Adicionar/Remover da enquete`

3. **Observe o console do bot** - os logs de permissão aparecerão automaticamente

### **Opção 3: Teste Automatizado**

1. **Configure o arquivo `.env.test`:**
   ```env
   TEST_USER_ID=SEU_ID_AQUI
   ```

2. **Execute o teste:**
   ```bash
   npm run test:permissions
   ```

3. **Analise o relatório completo** que será exibido

---

## 🔍 Interpretando os Logs

### **Caso 1: Usuário TEM Permissão**

```
✅ [PERMISSION] Usuário está na lista de CRIADORES INTERNOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Caso 2: Usuário NÃO está na Lista**

```
⚠️ [PERMISSION] Usuário NÃO está na lista de criadores internos
🔍 [ROLE CHECK] Verificando cargos autorizados...
   Guild ID: 1328140418055012383
   Cargos autorizados para esta guild: []
⚠️ [ROLE CHECK] Nenhum cargo autorizado configurado para esta guild
❌ [PERMISSION] PERMISSÃO NEGADA - Usuário não atende nenhum critério
```

**Solução:** Adicionar à lista de criadores:
```
/criador-de-enquete adicionar @usuario
```

### **Caso 3: Usuário tem Cargo Autorizado**

```
✅ [ROLE CHECK] Membro tem cargo autorizado: ['1234567890']
✅ [PERMISSION] Usuário tem CARGO AUTORIZADO
```

---

## 🛠️ Soluções Comuns

### **Problema: Usuário não está na lista de criadores**

**Verificar:**
```bash
cat criadores-internos.json
```

**Adicionar manualmente:**
```json
{
  "criadores": ["300728666042662912", "ID_DO_NOVO_USUARIO"]
}
```

**Ou usar o comando:**
```
/criador-de-enquete adicionar @usuario
```

### **Problema: Arquivo criadores-internos.json não existe**

**Criar:**
```bash
echo '{"criadores":["300728666042662912"]}' > criadores-internos.json
```

### **Problema: IDs diferentes entre prod/staging**

**Verificar arquivos separados:**
```bash
# Produção
cat criadores-internos.json

# Staging
cat data/staging/criadores-internos.json
```

---

## 📊 Checklist de Diagnóstico

- [ ] Bot está rodando sem erros
- [ ] Arquivo `criadores-internos.json` existe
- [ ] ID do usuário está correto no arquivo
- [ ] Comando `/debug-permissoes` foi executado
- [ ] Logs aparecem no console ao tentar usar toggle
- [ ] Comandos de contexto aparecem no menu (clique direito)
- [ ] Deploy dos comandos foi feito (`npm run deploy`)

---

## 🚨 Se Ainda Não Funcionar

**Reporte o seguinte:**

1. **Output do comando `/debug-permissoes`**
2. **Logs completos do console** ao tentar usar o toggle
3. **Conteúdo do arquivo:**
   ```bash
   cat criadores-internos.json
   ```
4. **Versão do bot:**
   ```bash
   npm run start | grep "Bot versão"
   ```

---

## 📝 Comandos Úteis

```bash
# Subir bot com logs
npm start

# Fazer deploy dos comandos
npm run deploy

# Testar permissões
npm run test:permissions

# Ver criadores cadastrados
cat criadores-internos.json

# Adicionar criador manualmente
# Edite criadores-internos.json e adicione o ID
```

---

## ⚙️ Arquivos Modificados

- ✅ `utils/permissions.js` - Adicionados logs detalhados
- ✅ `commands/debug-permissoes.js` - Novo comando criado
- ✅ `test-bot/test-permissions-debug.js` - Novo teste criado
- ✅ `test-bot/.env.test` - Adicionado TEST_USER_ID
- ✅ `package.json` - Adicionado script `test:permissions`

---

**Pronto para testar! Execute `/debug-permissoes` no Discord e veja o que está acontecendo.** ✅
