/\*\*

- =====================================================
- DOCUMENTAÇÃO TÉCNICA - LittleBoatPoll
- Bot Discord para Clube do Livro com Sistema de Votos Ponderados
- =====================================================
-
- Este documento explica a arquitetura, fluxo de dados e decisões técnicas
  \*/

// =====================================================
// 1. VISÃO GERAL DA ARQUITETURA
// =====================================================

/_
┌─────────────────────────────────────────────────────┐
│ USUÁRIOS NO DISCORD │
│ (Adicionam / Removem Reações nas Enquetes) │
└────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ client.on('messageReactionAdd') │
│ client.on('messageReactionRemove') │
│ (Listeners de Eventos) │
└────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ client.activePolls Map │
│ { │
│ "messageid123": { │
│ messageId: "123", │
│ livro: "1984", │
│ votos: { │
│ "userid123": { │
│ usuario: "username", │
│ peso: 2, // VIP = 2, Comum = 1 │
│ reacao: "👍" │
│ } │
│ } │
│ } │
│ } │
└────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ /encerrar Command │
│ (Calcula pesos e anuncia resultado) │
└────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ historico-votacoes.json │
│ (Arquivo de persistência) │
└─────────────────────────────────────────────────────┘
_/

// =====================================================
// 2. FLUXO DE UMA VOTAÇÃO COMPLETA
// =====================================================

/\*
PASSO 1: Criar Enquete
/enquete livro:"1984" autor:"George Orwell" paginas:328
│
├─ Bot cria Embed com informações do livro
├─ Bot envia mensagem no canal com reações 👍 e 👎
├─ Bot armazena em client.activePolls
└─ Retorno: messageId para usar nos próximos cmds

PASSO 2: Iniciar (Opcional)
/iniciar mensagem_id:123456789
│
└─ Marca enquete como "ativa"

PASSO 3: Votação em Andamento
Usuários reagem com 👍 ou 👎
│
├─ Event: messageReactionAdd triggered
├─ Bot verifica se é uma votação ativa
├─ Bot consulta vips.json para determinar peso
├─ Bot adiciona voto em client.activePolls
└─ Se remover reação: messageReactionRemove triggered

PASSO 4: Encerrar
/encerrar mensagem_id:123456789
│
├─ Bot percorre todos os votos
├─ Soma: votosPositivos += voto.peso
├─ Soma: votosNegativos += voto.peso
├─ Determina: votosPositivos > votosNegativos?
├─ Cria Embed com resultado
├─ Salva em historico-votacoes.json
└─ Anuncia resultado no canal
\*/

// =====================================================
// 3. SISTEMA DE PESOS DE VOTO
// =====================================================

/\*
LÓGICA IMPLEMENTADA EM: commands/encerrar.js

Para cada voto registrado:

1. Verificar se usuário está em vips.json
   - Se SIM → peso = 2 (MENSALISTA/VIP)
   - Se NÃO → peso = 1 (COMUM)

2. Somar votos com seus pesos respectivos:

   Exemplo:
   ├─ Usuário A (comum) votou 👍 → +1 ponto SIM
   ├─ Usuário B (VIP) votou 👍 → +2 pontos SIM (dobrado!)
   ├─ Usuário C (comum) votou 👎 → +1 ponto NÃO
   ├─ Usuário D (VIP) votou 👎 → +2 pontos NÃO (dobrado!)
   └─ TOTAL: 3 SIM vs 3 NÃO = EMPATE

3. O peso é determinado NO MOMENTO DA REAÇÃO
   - Se usuário vira VIP depois de reagir:
     A reação dele já contará como peso 1
   - Se usuário for removido de VIP e reagir novamente:
     O novo voto será peso 1
     \*/

// =====================================================
// 4. ESTRUTURA DE DADOS
// =====================================================

// client.activePolls (Mapa em memória - perdido ao reiniciar)
/_
Map {
"1234567890123456789" => {
messageId: "1234567890123456789",
livro: "1984",
autor: "George Orwell",
paginas: 328,
criadoEm: Date,
iniciadaEm: Date,
finalizadaEm: Date,
votos: {
"userid1": {
usuario: "username1",
peso: 2,
reacao: "👍",
timestamp: Date
},
"userid2": {
usuario: "username2",
peso: 1,
reacao: "👎",
timestamp: Date
}
},
status: "ativa" | "finalizada"
}
}
_/

// vips.json (Arquivo - Persistente entre reinicializações)
/_
{
"vips": [
"123456789123456789",
"987654321987654321",
"111222333444555666"
]
}
_/

// historico-votacoes.json (Criado automaticamente)
/_
[
{
"livro": "1984",
"autor": "George Orwell",
"paginas": 328,
"votosPositivos": 15,
"votosNegativos": 8,
"resultado": "✅ LIVRO APROVADO!",
"participantes": 8,
"dataCriacao": "2026-02-25T14:30:00.000Z",
"dataFinalizacao": "2026-02-25T15:45:00.000Z"
}
]
_/

// =====================================================
// 5. INTENTS DO DISCORD - O QUE SÃO E POR QUÊ
// =====================================================

/\*
Discord Intents são "categorizações de eventos" que o bot pode escutar.
Devem ser habilitados tanto no código quanto no Developer Portal.

INTENTS HABILITADOS EM index.js:

1. GatewayIntentBits.Guilds
   ├─ O que: Receber eventos sobre servidores
   ├─ Por quê: Saber quando o bot entra/sai de um servidor
   └─ Eventos: guildCreate, guildDelete, etc

2. GatewayIntentBits.GuildMessages
   ├─ O que: Receber eventos sobre mensagens nos canais
   ├─ Por quê: Processar mensagens do servidor
   └─ Eventos: messageCreate, messageUpdate, etc

3. GatewayIntentBits.MessageContent
   ├─ O que: Ler o conteúdo completo das mensagens
   ├─ Por quê: Analisar texto, comandos antigos (prefixed)
   ├─ Nota: É um Privileged Intent - requer aprovação
   └─ Eventos: Permite ler interaction.content

4. GatewayIntentBits.DirectMessages
   ├─ O que: Receber mensagens diretas (DMs)
   ├─ Por quê: Permitir interações privadas
   └─ Eventos: Mensagens em canal DM

5. GatewayIntentBits.GuildMessageReactions ⭐ CRUCIAL
   ├─ O que: Receber eventos sobre reações em mensagens
   ├─ Por quê: ESSENCIAL para o sistema de votação!
   ├─ SEM ISSO: Bot não consegue ler 👍 e 👎
   └─ Eventos: messageReactionAdd, messageReactionRemove

COMO HABILITAR NO DEVELOPER PORTAL:

1. https://discord.com/developers/applications
2. Selecione sua aplicação
3. Vá em "Bot"
4. Scroll para "PRIVILEGED GATEWAY INTENTS"
5. Habilite:
   ✅ Presence Intent
   ✅ Server Members Intent
   ✅ Message Content Intent
   \*/

// =====================================================
// 6. FLUXO DE DADOS DETALHADO
// =====================================================

/\*
QUANDO USUÁRIO REAGE:

┌─────────────────────────────────────────────────────┐
│ 1. Usuário clica em 👍 na mensagem │
└──────────────┬──────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ 2. Discord envia evento: messageReactionAdd │
│ { │
│ reaction: { │
│ emoji: { name: '👍' }, │
│ message: { id: '123...' } │
│ }, │
│ user: { id: '456...', username: 'João' } │
│ } │
└──────────────┬──────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ 3. index.js: client.on('messageReactionAdd') │
│ └─ Ignora se for reação do bot │
└──────────────┬──────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ 4. Busca enquete em client.activePolls │
│ const poll = client.activePolls.get(id) │
└──────────────┬──────────────────────────────────────┘
│
▼ Enquete encontrada?
│
SIM ┌─┴─┐ NÃO
│ │
▼ ▼
Continuar Sair
│
▼
┌─────────────────────────────────────────────────────┐
│ 5. Verifica se usuário é VIP │
│ const vipsData = JSON.parse( │
│ fs.readFileSync('./vips.json', 'utf8') │
│ ); │
│ const isVIP = vipsData.vips.includes(user.id) │
└──────────────┬──────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ 6. Define peso do voto │
│ const peso = isVIP ? 2 : 1 │
└──────────────┬──────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ 7. Adiciona voto em poll.votos │
│ poll.votos[user.id] = { │
│ usuario: 'João', │
│ peso: 1 ou 2, │
│ reacao: '👍', │
│ timestamp: Date │
│ } │
└──────────────┬──────────────────────────────────────┘
│
▼
Voto registrado! ✅
\*/

// =====================================================
// 7. QUANDO USUÁRIO CLICA EM /ENCERRAR
// =====================================================

/\*
PASSO A PASSO DO CÁLCULO:

1. Busca a enquete: client.activePolls.get(messageId)

2. Carrega lista VIP: JSON.parse(fs.readFileSync('./vips.json'))

3. Itera sobre todos os votos:

   for (const [userId, votoData] of Object.entries(poll.votos)) {
   const peso = votoData.peso; // Já definido no registro

   if (reacao === '👍') {
   votosPositivos += peso; // Ex: 1 ou 2
   } else if (reacao === '👎') {
   votosNegativos += peso; // Ex: 1 ou 2
   }
   }

4. Compara resultados:

   if (votosPositivos > votosNegativos) {
   resultado = "✅ LIVRO APROVADO!" // Verde
   } else if (votosNegativos > votosPositivos) {
   resultado = "❌ LIVRO REJEITADO" // Vermelho
   } else {
   resultado = "🤝 EMPATE!" // Amarelo
   }

5. Cria Embed com resultado

6. Salva em historico-votacoes.json (JSON.stringify com indent)

7. Envia no canal e marca como status: "finalizada"
   \*/

// =====================================================
// 8. PERSISTÊNCIA DE DADOS
// =====================================================

/\*
DADOS QUE PERSISTEM (Sobrevivem reinicialização):
├─ vips.json (Lista de IDs VIP)
└─ historico-votacoes.json (Histórico de votações)

DADOS QUE SE PERDEM (Perdidos ao reiniciar):
├─ client.activePolls (Votações em andamento)
└─ Votos ainda não finalizados

IMPLICAÇÃO:

- Se o bot reiniciar DURANTE uma votação, os votos se perdem
- Solução futura: Usar banco de dados (MongoDB, PostgreSQL)
- Alternativa atual: Melhorar salvamento de sessão

COMO MELHORAR:

1. Adicionar file watcher para sincronizar dados
2. Usar banco de dados persistente
3. Implementar checkpoint de votos a cada reação
   \*/

// =====================================================
// 9. EXEMPLO COMPLETO DE VOTAÇÃO
// =====================================================

/\*
CENÁRIO:

Clube do Livro tem 5 membros:
├─ João (VIP/Mensalista) - peso 2
├─ Maria (comum) - peso 1
├─ Pedro (VIP) - peso 2
├─ Ana (comum) - peso 1
└─ Carlos (comum) - peso 1

VOTAÇÃO ACONTECIDA:

João reagiu 👍 → +2 (é VIP)
Maria reagiu 👍 → +1 (comum)
Pedro reagiu 👎 → +2 (é VIP)
Ana reagiu 👍 → +1 (comum)
Carlos reagiu 👎 → +1 (comum)

RESULTADO FINAL:

votosPositivos = 2 + 1 + 1 = 4
votosNegativos = 2 + 1 = 3

4 > 3 → ✅ LIVRO APROVADO!

Se todos tivessem peso 1:
votosPositivos = 3
votosNegativos = 2
Resultado seria igual ✅ APROVADO

Mas com sistema de pesos:
votosPositivos = 4 (VIP de João + 2 comuns)
votosNegativos = 3 (VIP de Pedro + 1 comum)

O voto do membros VIP fez diferença! 📈
\*/

// =====================================================
// 10. TRATAMENTO DE ERROS
// =====================================================

/\*

- O arquivo index.js tem try/catch em ambos listeners
- Cada comando tem try/catch próprio
- Erros são logados no console (vermelho)
- Usuário recebe mensagem de erro (ephemeral: true)

ERROS COMUNS E SOLUÇÕES:

Erro: "Cannot read property 'vips' of undefined"
└─ Causa: vips.json está vazio ou não existe
└─ Solução: Reiniciar bot ou criar manualmente

Erro: "ENOENT: no such file or directory"
└─ Causa: Arquivo não encontrado
└─ Solução: Executar node index.js uma vez para init

Erro: "Token invalid"
└─ Causa: TOKEN no .env incorreto
└─ Solução: Copiar token do Developer Portal novamente
\*/

// =====================================================
// 11. SEGURANÇA E BOAS PRÁTICAS
// =====================================================

/\*
✅ IMPLEMENTADO:

- Token em arquivo .env (nunca commitado)
- Validação de IDs antes de buscar dados
- Tratamento de exceções em todos os eventos
- Logs detalhados (console.log)
- Ephemeral replies para mensagens sensíveis

⚠️ PRÓXIMOS PASSOS:

- Adicionar permissões (apenas admin pode usar /mensalista)
- Implementar rate limiting
- Adicionar logs a arquivo (não apenas console)
- Usar variáveis de ambiente para mais configurações
  \*/

// =====================================================
// 12. COMO DEBUGAR PROBLEMAS
// =====================================================

/\*

1. REAÇÕES NÃO SÃO REGISTRADAS:
   └─ Verifique console.log para ver se "messageReactionAdd" é chamado
   └─ Se não aparecer:
   └─ GatewayIntentBits.GuildMessageReactions não está habilitado
   └─ Habilite em: Developer Portal → Bot → PRIVILEGED GATEWAY INTENTS

2. VOTOS NÃO CONTAM COM PESO CORRETO:
   └─ Verifique se usuário está em vips.json
   └─ Execute /mensalista listar para confirmar
   └─ Verifique console.log durante /encerrar

3. HISTÓRICO NÃO SALVA:
   └─ Verifique se existe pasta com permissão de escrita
   └─ Veja se historico-votacoes.json foi criado

4. MONITORAR LOGS:
   └─ Abra:c node index.js
   └─ Procure por: ✅ ❌ 🔔 🗑️ (emojis nos logs)
   \*/

// =====================================================

/\*
FIM DA DOCUMENTAÇÃO TÉCNICA

Para mais informações:

- Discord.js Docs: https://discord.js.org
- Discord API: https://discord.com/developers/docs
  \*/
