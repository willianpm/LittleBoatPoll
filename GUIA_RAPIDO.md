# 🚀 GUIA RÁPIDO - LittleBoatPoll

## 5 Minutos para Começar

### ✅ Pré-requisitos

- Node.js instalado
- Um servidor Discord
- Permissões de administrador no servidor

---

## PASSO 1: Clonar e Instalar

```bash
cd LittleBoatPoll
npm install
```

---

## PASSO 2: Configurar o Token

### Obter Token no Discord Developer Portal

1. Acesse: https://discord.com/developers/applications
2. Clique em **New Application**
3. Dê um nome: **LittleBoatPoll**
4. Vá em **Bot** → Clique **Add Bot**
5. Em **TOKEN**, clique **Copy**
6. Crie arquivo `.env` (se não existir):

```env
TOKEN=seu_token_aqui
CLIENT_ID=1234567890123456789
GUILD_ID=9876543210987654321
```

### Habilitar Intents

1. Em **Bot** (Developer Portal), procure **PRIVILEGED GATEWAY INTENTS**
2. Habilite:
   - ✅ Message Content Intent
   - ✅ Server Members Intent (opcional)

---

## PASSO 3: Registrar Comandos

Execute uma vez:

```bash
node deploy-commands.js
```

Resultado esperado:

```
🔄 Registrando comandos slash no Discord...

✅ 4 comando(s) registrado(s) com sucesso!

📋 Comandos disponíveis:
  • /enquete - Cria uma enquete para votação do Clube do Livro
  • /iniciar - Inicia o período de votação da enquete
  • /encerrar - Encerra a votação e anuncia o resultado final
  • /mensalista - Gerencia a lista de membros VIP do Clube do Livro
```

---

## PASSO 4: Iniciar o Bot

```bash
node index.js
```

Aguarde:

```
✅ LittleBoatPoll está ONLINE como LittleBoatPoll#1234!
📊 Gerenciador de Clube do Livro iniciado
```

---

## PASSO 5: Usar os Comandos

### Criar uma Enquete

No Discord, no canal do seu servidor, digite:

```
/enquete livro:"1984" autor:"George Orwell" paginas:328
```

O bot responderá com:

```
📚 NOVA ENQUETE - CLUBE DO LIVRO 📚

Vote abaixo se deseja ler esse livro no próximo mês!

📖 Livro: 1984
✍️ Autor: George Orwell
📄 Páginas: 328

Vote com 👍 para SIM ou 👎 para NÃO
```

### Membros Votam

Clique nas reações:

- 👍 = Sim, quero ler
- 👎 = Não quero ler

### Adicionar Membros VIP (Mensalistas)

```
/mensalista adicionar usuario:@nomeuser
```

Esses membros terão seus votos contando **DOBRA** (peso 2).

### Finalizar e Ver Resultado

```
/encerrar mensagem_id:1234567890
```

Para obter o ID da mensagem:

- Clique com botão direito na mensagem da enquete
- Selecione **Copy Message ID**
- Cole no comando

Resultado:

```
📊 RESULTADO FINAL DA VOTAÇÃO 📊

Votação encerrada para: 1984

📖 Livro: 1984
✍️ Autor: George Orwell
📄 Páginas: 328

👍 Votos Sim: 15 pontos
👎 Votos Não: 8 pontos

🏆 RESULTADO: ✅ LIVRO APROVADO!

Total de participantes: 8
Membros VIP contam como peso 2
```

---

## 📝 Exemplos de Casos de Uso

### Caso 1: Votação Simples

```
/enquete livro:"O Pequeno Príncipe" autor:"Antoine de Saint-Exupéry" paginas:96
```

Votaram:

- João (VIP) 👍
- Maria (comum) 👍
- Pedro (comum) 👎

```
Votação Final:
- SIM: 2 (João VIP=2) + 1 (Maria comum=1) = 3 pontos
- NÃO: 1 (Pedro comum=1) = 1 ponto
✅ APROVADO!
```

### Caso 2: Empate

```
/enquete livro:"Harry Potter" autor:"J.K. Rowling" paginas:309
```

Votaram:

- Ana (VIP) 👍 = 2 pontos
- Carlos (comum) 👎 = 1 ponto
- Laura (comum) 👎 = 1 ponto

```
- SIM: 2 pontos
- NÃO: 2 pontos
🤝 EMPATE!
```

### Caso 3: Rejeitado

```
/enquete livro:"O Cortiço" autor:"Aluísio Azevedo" paginas:316
```

Votaram:

- Felipe (VIP) 👎 = 2 pontos
- Marcela (VIP) 👎 = 2 pontos
- Roberto (comum) 👍 = 1 ponto

```
- SIM: 1 ponto
- NÃO: 4 pontos
❌ REJEITADO
```

---

## 🔧 Troubleshooting Rápido

| Problema                    | Solução                                 |
| --------------------------- | --------------------------------------- |
| Bot não aparece online      | Verifique TOKEN no .env                 |
| Comandos não aparecem       | Execute `node deploy-commands.js`       |
| Mensagem "Erro ao executar" | Veja o console (terminal) para detalhes |
| Reações não contam          | Habilite Message Content Intent         |
| `cannot read vips`          | Reinicie o bot com `node index.js`      |

---

## 📊 Fluxo Completo

```
1️⃣ Criar Enquete
   /enquete livro:"X" autor:"Y" paginas:Z

2️⃣ Membros Votam
   Clique nas reações 👍 👎

3️⃣ (Novo!) Encerrar com Botão ✨
   Clique no botão 🛑 "Encerrar Votação"

   OU método antigo:
   /encerrar mensagem_id:...

4️⃣ Resultado Aparece Imediatamente
   ✅ APROVADO / ❌ REJEITADO / 🤝 EMPATE
```

---

## 🎯 Próximas Steps

1. **Gerenciar Mensalistas:**

   ```
   /mensalista adicionar usuario:@presidente
   /mensalista adicionar usuario:@vice
   /mensalista listar
   ```

2. **Reativar Bot e Histórico:**
   - Verifique `historico-votacoes.json` para ver votações passadas

3. **Customizar:**
   - Edite cores no código (`.setColor('#FFD700')`)
   - Mude emojis (substitua 👍 e 👎)
   - Customize mensagens

---

## 🆘 Precisa de Ajuda?

**Bot não liga:**

```bash
node index.js  # Vê se tem errores
```

**Quer reiniciar:**

```bash
Ctrl+C  # Para o bot
node index.js  # Reinicia
```

**Ver histórico:**
Abra `historico-votacoes.json` com um editor

---

## ✨ Agora Tá Pronto!

Seu bot de votação para Clube do Livro está funcionando! 📚🎉
