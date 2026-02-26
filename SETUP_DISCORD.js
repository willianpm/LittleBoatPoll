/**
 * ============================================
 * SETUP COMPLETO DO DISCORD
 * Passo a Passo para Registrar o Bot
 * ============================================
 */

// ============================================
// 1. CRIAR A APLICAÇÃO NO DEVELOPER PORTAL
// ============================================

/*
PASSO A PASSO:

1. Acesse: https://discord.com/developers/applications
2. Clique em "New Application" (canto superior direito)
3. Dê um nome: "LittleBoatPoll"
4. Clique em "Create"

🎉 Pronto! Agora você tem uma aplicação
*/

// ============================================
// 2. ENCONTRAR CLIENT_ID
// ============================================

/*
COMO ENCONTRAR:

1. Você está na página da aplicação
2. Vá em "General Information" (abra se não estiver)
3. Procure por "APPLICATION ID"
   ↓
   COPIE ESTE NÚMERO

Exemplo:
CLIENT_ID = "1234567890123456789"

PASSO NO .env:
CLIENT_ID=1234567890123456789
*/

// ============================================
// 3. CRIAR O BOT
// ============================================

/*
PASSO A PASSO:

1. Na sua aplicação, clique em "Bot" (lado esquerdo)
2. Clique em "Add Bot"
3. Um novo bot foi criado!

⚠️ IMPORTANTE: Nunca compartilhe o TOKEN
*/

// ============================================
// 4. COPIAR TOKEN DO BOT
// ============================================

/*
COMO ENCONTRAR E COPIAR O TOKEN:

1. Clique em "Bot" (lado esquerdo)
2. Procure pela seção "TOKEN"
3. Clique em "Copy"

Exemplo de token (NUNCA compartilhe):
TOKEN=MTQ3NjE5ODg2MjI1MDMxMTc5MQ.Gv_xx.dXXXXXXXXXXXXXXXXXXXXXX

PASSO NO .env:
TOKEN=MTQ3NjE5ODg2MjI1MDMxMTc5MQ.Gv_xx.dXXXXXXXXXXXXXXXXXX

⚠️ SE COMPARTILHOU:
- Clique em "Regenerate" para gerar um novo
- NUNCA commit .env no Git!
*/

// ============================================
// 5. HABILITAR PRIVILEGED GATEWAY INTENTS
// ============================================

/*
IMPORTANTE: SEM ISSO, O BOT NÃO LÊ REAÇÕES!

PASSO A PASSO:

1. Clique em "Bot" (lado esquerdo)
2. Scroll para baixo até "PRIVILEGED GATEWAY INTENTS"
3. Habilite:
   ✅ Message Content Intent (OBRIGATÓRIO)
   ✅ Server Members Intent (opcional)

4. Clique em "Save Changes"

O QUE CADA UM FAZ:

- Message Content Intent:
  • Permite ler o conteúdo das mensagens
  • Necessário para processar comandos
  • Discord requer justificação se não moderado

- Presence Intent:
  • Ver status dos usuários (online/away/dnd)
  • Menos importante para votações

- Server Members Intent:
  • Ver membros que entram/saem
  • Menos importante para votações

⚠️ NOTE: GatewayIntentBits.GuildMessageReactions
   Não aparece no Developer Portal como "privileged"
   Mas está habilitado automaticamente em index.js
*/

// ============================================
// 6. CONFIGURAR PERMISSÕES DO BOT
// ============================================

/*
PASSO A PASSO:

1. Clique em "Bot" (lado esquerdo)
2. Em "INTENTS", verifique se habilitou Message Content Intent
3. Scroll para "Permissions"
4. Habilite as permissões necessárias:

✅ ESSENCIAIS:
   - Send Messages
   - Embed Links
   - Read Message History
   - Add Reactions

✅ RECOMENDADAS:
   - Read Message/Channel
   - Manage Messages
   - Use External Emojis

As permissões podem ser configuradas também:
- Globalmente (aqui no portal)
- Por servidor (depois)
- Por canal (depois)
*/

// ============================================
// 7. ADICIONAR BOT AO SEU SERVIDOR DISCORD
// ============================================

/*
PASSO A PASSO:

1. No Developer Portal, clique em "OAuth2" (lado esquerdo)
2. Escolha "URL Generator"
3. Em "SCOPES", habilite:
   ✅ bot
   ✅ applications.commands

   Isso gera a URL de convite!

4. Em "PERMISSIONS" (abaixo), habilite:
   ✅ Send Messages
   ✅ Embed Links
   ✅ Add Reactions
   ✅ Read Messages/Channels
   ✅ Read Message History

5. Copie a URL gerada (no final)
6. Abra a URL em um navegador
7. Selecione seu servidor Discord
8. Autorize

🎉 Bot adicionado ao servidor!
*/

// ============================================
// 8. ENCONTRAR GUILD_ID (Server ID)
// ============================================

/*
PASSO A PASSO:

1. Abra Discord e clique no seu servidor
2. Clique em "User Settings" (engrenagem, canto inferior esquerdo)
3. Vá em "Advanced" (lado esquerdo)
4. Habilite "Developer Mode"
5. Feche User Settings

AGORA:
6. Clique com botão direito no nome do seu servidor
7. Selecione "Copy Server ID"

Exemplo:
GUILD_ID = "123456789012345678"

OBS: Alguns comandos usam este ID
*/

// ============================================
// 9. ARQUIVO .env COMPLETO
// ============================================

/*
Crie o arquivo .env na raiz do projeto:

------- ARQUIVO .env -------

# Token do seu Bot Discord
# NUNCA compartilhe este token!
# Se compartilhou, clique em "Regenerate" no portal
TOKEN=SEU_TOKEN_AQUI

# ID da sua aplicação (Client ID)
# Encontre em: Developer Portal > General Information
CLIENT_ID=SEU_CLIENT_ID_AQUI

# ID do seu servidor Discord (Guild ID)
# Ative Developer Mode e copie
GUILD_ID=SEU_GUILD_ID_AQUI

------- FIM DO ARQUIVO .env -------

⚠️ NUNCA faça commit deste arquivo no Git!
✅ Adicione .env ao .gitignore:

echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
*/

// ============================================
// 10. VERIFICAR SE ESTÁ TUDO CERTO
// ============================================

/*
CHECKLIST:

□ Arquivo .env criado com TOKEN, CLIENT_ID, GUILD_ID
□ Token copiado do Developer Portal (sem espacos)
□ Privileged Gateway Intents habilitados
□ Bot adicionado ao servidor Discord
□ Developer Mode habilitado no Discord (para copiar IDs)
□ npm install executado (dependências instaladas)

TESTE:
npm run install
node deploy-commands.js
node index.js

Esperado:
✅ LittleBoatPoll está ONLINE como LittleBoatPoll#XXXX!
📊 Gerenciador de Clube do Livro iniciado

Se não funcionar, verifique:
1. TOKEN está correto?
2. CLIENT_ID está correto?
3. Bot foi adicionado ao servidor?
4. Privileged Gateway Intents habilitados?
*/

// ============================================
// 11. ESTRUTURA DE PERMISSÕES
// ============================================

/*
NÍVEIS DE PERMISSÃO (DO MAIS RESTRITIVO AO MAIS AMPLO):

1. CANAL
   - Permissões específicas para um canal
   - Exemplo: Bot pode ver #votacoes mas não #admin

2. SERVIDOR (Guild)
   - Permissões gerais para todo o servidor
   - Exemplo: Criador vs Membro comum

3. GLOBAL (Developer Portal)
   - Permissões base do bot
   - Já fazemos aqui

COMO DEFINIR PERMISSÕES POR CANAL:

1. No Discord, clique direito no canal
2. "Edit Channel"
3. "Permissions"
4. Procure o role do bot (LittleBoatPoll)
5. Configure permissões específicas

No futuro, você pode querer:
- Bot pode ver apenas #votacoes
- Criador pode usar todos os comandos
- Membros comuns podem só votar
*/

// ============================================
// 12. PROBLEMAS COMUNS DURANTE SETUP
// ============================================

/*
PROBLEMA: "Invalid Token"
CAUSA: Token copiado errado
SOLUÇÃO: Regenere o token e copie novamente

PROBLEMA: Bot não aparece online
CAUSA: Token errado no .env
SOLUÇÃO: Verifique se o token está certo (sem espaços)

PROBLEMA: "Missing Access"
CAUSA: Bot não tem permissão para executar ação
SOLUÇÃO: Dê permissão "Send Messages" ao bot

PROBLEMA: Comandos não aparecem no Discord
CAUSA: deploy-commands.js não executado
SOLUÇÃO: Rode node deploy-commands.js

PROBLEMA: "This token is being used by another bot"
CAUSA: Você copiou um token já em uso
SOLUÇÃO: Regenere um novo token

PROBLEMA: "Unknown Application"
CAUSA: CLIENT_ID incorreto
SOLUÇÃO: Verifique CLIENT_ID no Developer Portal
*/

// ============================================
// 13. SEGURANÇA E BOAS PRÁTICAS
// ============================================

/*
✅ FAÇA:
- Mantenha .env seguro
- Use .gitignore para não expor token
- Regenere token se compartilhar acidentalmente
- Especifique permissões mínimas necessárias
- Use ephemeral: true para mensagens sensíveis

❌ NÃO FAÇA:
- Nunca compartilhe seu TOKEN
- Nunca faça commit de .env no Git
- Não use tokens compartilhados
- Não habilite permissões desnecessárias
- Não esqueça de fazer logout da aplicação no portal
*/

// ============================================
// 14. RESUMO DO FLUXO COMPLETO
// ============================================

/*
1️⃣ Criar aplicação no Developer Portal
   → Copia CLIENT_ID
   → Salva em .env

2️⃣ Criar Bot na aplicação
   → Copia TOKEN
   → Salva em .env

3️⃣ Habilitar Privileged Gateway Intents
   → Message Content Intent (obrigatório)

4️⃣ Configurar permissões
   → Send Messages, Add Reactions, etc

5️⃣ Gerar URL de convite (OAuth2)
   → Adiciona bot ao servidor

6️⃣ Encontrar GUILD_ID
   → Ativa Developer Mode
   → Copia Server ID
   → Salva em .env

7️⃣ npm install
   → Instala dependências

8️⃣ node deploy-commands.js
   → Registra comandos slash

9️⃣ node index.js
   → Bot online!

🎉 PRONTO!

Estrutura .env final:
TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=seu_guild_id_aqui
*/

console.log('📚 Guia de Setup Discord carregado!');
