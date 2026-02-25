/**
 * ============================================
 * COMENTÁRIOS DETALHADOS NO CÓDIGO
 * ============================================
 *
 * Este arquivo explica as partes críticas do código
 * e como funcionam os principais mecanismos
 */

// ============================================
// 1. CONFIGURAÇÃO INICIAL DO INDEX.JS
// ============================================

/*
require('dotenv').config();

O que faz: Carrega variáveis do arquivo .env
Por quê: Para não expor o TOKEN no código

Exemplo .env:
TOKEN=MEU_TOKEN_SECRETO
*/

/*
const { Client, GatewayIntentBits, Collection, ChannelType } = require('discord.js');

Importações:
- Client: Classe principal do bot
- GatewayIntentBits: Permissões de eventos
- Collection: Tipo de dado (como um Map)
- ChannelType: Tipos de canais Discord
*/

/*
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,  // ⭐ CRÍTICO para reações
  ],
});

Intents: São as "categorias de eventos" que o bot quer escutar
Se não adicionar um intent aqui, o bot não receberá esses eventos
*/

/*
client.activePolls = new Map();

Uma Map (tipo de dado especial) para armazenar enquetes ATIVAS
Estrutura:
{
  "messageId123": { dados da enquete },
  "messageId456": { dados da enquete }
}
*/

// ============================================
// 2. CARREGAMENTO DE COMANDOS (Loop)
// ============================================

/*
const commandFiles = fs.readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

Lê todos os arquivos da pasta commands/ que terminam em .js
Exemplo: poll.js, encerrar-context.js, criadores.js, mensalista.js
*/

/*
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

Para cada arquivo encontrado:
1. Carrega o arquivo com require()
2. Verifica se tem properties .data e .execute
3. Armazena em client.commands (uma Collection)

Todo comando deve ter:
- module.exports.data = new SlashCommandBuilder()...
- module.exports.execute = async (interaction, client) => {}
*/

// ============================================
// 3. EVENTO: REAÇÃO ADICIONADA (CRÍTICO)
// ============================================

/*
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;  // Ignora reações do próprio bot

O evento messageReactionAdd é disparado quando alguém reage
Parâmetros:
- reaction: O objeto da reação (emoji, contagem, etc)
- user: Quem reagiu

if (user.bot) return;  // Muito importante! Evita loop infinito
*/

/*
const poll = client.activePolls.get(reaction.message.id);
if (!poll) return;

Busca se essa mensagem tem uma votação ativa
Se não tiver, sai da função
*/

/*
const vipsData = JSON.parse(fs.readFileSync('./vips.json', 'utf8'));
const isVIP = vipsData.vips.includes(user.id);
const peso = isVIP ? 2 : 1;

Lógica de peso:
1. Lê o arquivo vips.json
2. Converte JSON string para objeto JavaScript
3. Verifica se o ID do usuário está no array vips
4. Define peso: 2 se VIP, 1 se comum

Este é o CORAÇÃO do sistema de votação ponderada!
*/

/*
if (!poll.votos[user.id]) {
  poll.votos[user.id] = {
    usuario: user.username,
    peso: peso,
    reacao: reaction.emoji.name || reaction.emoji.id,
    timestamp: new Date(),
  };
}

Adiciona o voto se o usuário ainda não votou
Estrutura do voto:
- usuario: Nome para log/debug
- peso: 1 ou 2 (determinado acima)
- reacao: '👍' ou '👎'
- timestamp: Hora do voto
*/

// ============================================
// 4. COMANDO: /ENQUETE
// ============================================

/*
Opções do comando:
- livro (string, obrigatório)
- autor (string, obrigatório)
- paginas (número inteiro, obrigatório)

Fluxo:
1. Coleta as opções: interaction.options.getString('livro')
2. Cria um Embed (mensagem formatada)
3. Envia a mensagem no canal
4. Adiciona reações 👍 e 👎
5. Armazena em client.activePolls
*/

/*
const pollEmbed = new EmbedBuilder()
  .setColor('#FFD700')
  .setTitle('📚 NOVA ENQUETE - CLUBE DO LIVRO 📚')
  .addFields(...)
  .setFooter(...)
  .setTimestamp();

EmbedBuilder: Classe para criar mensagens formatadas
- setTitle: Título em negrito
- setColor: Cor (hexadecimal)
- addFields: Campos da mensagem
- setFooter: Rodapé
- setTimestamp: Data/hora no rodapé
*/

/*
const msg = await interaction.reply({
  embeds: [pollEmbed],
  fetchReply: true,
});

fetchReply: true é IMPORTANTE
Retorna a mensagem criada para que possamos usar seu ID
Sem isso, não conseguiríamos adicionar reações
*/

/*
await msg.react('👍');
await msg.react('👎');

Adiciona as reações na mensagem
As reações aparecem como botões que os usuários podem clicar
*/

// ============================================
// 5. COMANDO DE CONTEXTO: ENCERRAR VOTAÇÃO
// ============================================

/*
Comando executado via clique direito na mensagem
Mantém a mesma lógica de cálculo de votos
Mas é muito mais intuitivo para o usuário
*/

/*
for (const [userId, votoData] of Object.entries(poll.votos)) {
  const peso = votoData.peso;  // 1 ou 2
  
  if (votoData.reacao === '👍') {
    votosPositivos += peso;
  } else if (votoData.reacao === '👎') {
    votosNegativos += peso;
  }
}

Itera sobre todos os votos registrados
Para cada voto:
1. Pega o peso (já foi determinado em messageReactionAdd)
2. Verifica qual emoji foi usado
3. Soma o peso ao total correspondente

Exemplo com 4 votos:
- João (VIP) 👍 → votosPositivos += 2 → total: 2
- Maria (comum) 👍 → votosPositivos += 1 → total: 3
- Pedro (VIP) 👎 → votosNegativos += 2 → total: 2
- Ana (comum) 👎 → votosNegativos += 1 → total: 3

Resultado: 3 vs 3 = EMPATE
*/

/*
if (votosPositivos > votosNegativos) {
  resultado = '✅ LIVRO APROVADO!';
  cor = '#00FF00';  // Verde
} else if (votosNegativos > votosPositivos) {
  resultado = '❌ LIVRO REJEITADO';
  cor = '#FF0000';  // Vermelho
} else {
  resultado = '🤝 EMPATE!';
  cor = '#FFFF00';  // Amarelo
}

Determina o resultado baseado nos pesos acumulados
Também define a cor do Embed para visualização
*/

/*
let historico = [];
if (fs.existsSync(historicoFilePath)) {
  historico = JSON.parse(fs.readFileSync(historicoFilePath, 'utf8'));
}
historico.push({...});
fs.writeFileSync(historicoFilePath, JSON.stringify(historico, null, 2));

Salva o resultado em um arquivo JSON
1. Verifica se arquivo existe
2. Se existir, lê e faz parse
3. Adiciona novo resultado ao array
4. Escreve tudo de volta (com indentação para legibilidade)
*/

// ============================================
// 6. COMANDO: /MENSALISTA (Persistência)
// ============================================

/*
Subcomandos (dentro de um único comando):
- adicionar usuario:@user
- remover usuario:@user
- listar

Isso permite /mensalista com diferentes ações
*/

/*
.addSubcommand((subcommand) =>
  subcommand
    .setName('adicionar')
    .setDescription('Adiciona um usuário à lista de mensalistas VIP')
    .addUserOption(...)
)

Define um subcomando chamado "adicionar"
Com uma opção de tipo "User" (mencionar @usuário)
*/

/*
const subcommand = interaction.options.getSubcommand();

Se o usuário digitou /mensalista adicionar @joão
Aqui pegamos "adicionar"
*/

/*
if (subcommand === 'adicionar') {
  const usuario = interaction.options.getUser('usuario');
  
  if (vipsData.vips.includes(usuario.id)) {
    return await interaction.reply({...});
  }
  
  vipsData.vips.push(usuario.id);
  fs.writeFileSync(vipsFilePath, JSON.stringify(vipsData, null, 2));
}

Lógica de adicionar:
1. Pega o usuário mencionado
2. Verifica se já está na lista
3. Se está, retorna erro
4. Se não, adiciona o ID ao array vips
5. Salva tudo em vips.json
*/

/*
A razão de salvar em JSON e não em memória Only:
- Persistência entre reinicializações
- Se o bot reiniciar, os VIPs continuam VIPs
- Sem isso, ao reiniciar perderia a lista
*/

// ============================================
// 7. ERROS COMUNS E SOLUÇÕES
// ============================================

/*
ERRO: "Cannot read property 'vips' of undefined"

Causa: O JSON.parse falhou ou vips.json está mal formatado
Solução: Verifique conteúdo de vips.json

const vipsData = {...};  // Garante que sempre tem a estrutura
*/

/*
ERRO: "messageId not found in activePolls"

Causa: ID da mensagem incorreto ou enquete já finalizou
Solução: Copie novamente o ID com botão direito
*/

/*
ERRO: "Discord.js error: Missing Permissions"

Causa: Bot não tem permissão para adicionar reações
Solução: Dê permissão "Add Reactions" ao role do bot
*/

// ============================================
// 8. ESTRUTURA RECOMENDADA PARA NOVO COMANDO
// ============================================

/*
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seu-comando')
    .setDescription('Descrição do seu comando')
    .addStringOption((option) => option
      .setName('opcao1')
      .setDescription('Descrição')
      .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      const valor = interaction.options.getString('opcao1');
      
      // Sua lógica aqui
      
      await interaction.reply({
        content: 'Sucesso!',
        ephemeral: true,  // Só o usuário vê
      });
    } catch (error) {
      console.error('Erro:', error);
      await interaction.reply({
        content: '❌ Erro ao executar!',
        ephemeral: true,
      });
    }
  },
};
*/

// ============================================
// 9. TIPOS DE OPÇÕES DISPONÍVEIS
// ============================================

/*
.addStringOption()     - Texto
.addIntegerOption()    - Número inteiro
.addNumberOption()     - Número com decimal
.addBooleanOption()    - Verdadeiro/Falso
.addUserOption()       - Mencionar @usuário
.addChannelOption()    - Mencionar #canal
.addRoleOption()       - Mencionar @role
.addMentionableOption() - @usuário ou @role
*/

// ============================================
// 10. MELHORIAS FUTURAS POSSÍVEIS
// ============================================

/*
1. Permissões:
   - Apenas admin pode usar /mensalista
   - Apenas certos roles podem criar enquetes

2. Banco de Dados:
   - Guardar votos em MongoDB ou PostgreSQL
   - Histórico permanente e buscável

3. Interface Melhorada:
   - Buttons em vez de reações (v14 feature)
   - Timeouts (enquete auto-encerra em X minutos)

4. Estatísticas:
   - Comando /stats: mostra livros mais votados
   - Membro mais participativo
   - Taxa de aprovação

5. Notificações:
   - Avisos quando enquete vai acabar
   - Resumo semanal de votações

6. Múltiplas Opções:
   - Não só 👍👎, mas 5 estrelas ou múltiplas escolhas
*/

console.log('📖 Documentação interna carregada!');
