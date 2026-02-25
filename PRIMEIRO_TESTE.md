# 🧪 PRIMEIRO TESTE DO BOT

Guia para testar o bot pela primeira vez

---

## ✅ Verificações Iniciais

Antes de testar, certifique-se de que:

- [ ] Arquivo `.env` configurado com TOKEN, CLIENT_ID e GUILD_ID
- [ ] Privileged Gateway Intents habilitados no Developer Portal
- [ ] Bot adicionado ao seu servidor Discord
- [ ] Dependências instaladas (`npm install`)
- [ ] Comandos registrados (`node deploy-commands.js`)

---

## 🚀 PASSO 1: Iniciar o Bot

```bash
cd LittleBoatPoll
node index.js
```

**Output esperado:**

```
✅ Comando carregado: encerrar
✅ Comando carregado: iniciar
✅ Comando carregado: mensalista
✅ Comando carregado: enquete

✅ LittleBoatPoll está ONLINE como LittleBoatPoll#1234!
📊 Gerenciador de Clube do Livro iniciado
```

Se aparecer algum erro:

- Verifique se o TOKEN está correto no `.env`
- Certifique-se de que habilitou Message Content Intent

---

## 📝 PASSO 2: Testar /enquete

No Discord, no canal do seu servidor, digite:

```
/enquete livro:"1984" autor:"George Orwell" paginas:328
```

**O que deve acontecer:**

1. Bot responde com um Embed bonito
2. Duas reações aparecem automaticamente: 👍 e 👎
3. Mensagem exibe:

   ```
   📚 NOVA ENQUETE - CLUBE DO LIVRO 📚

   Vote abaixo se deseja ler esse livro no próximo mês!

   📖 Livro: 1984
   ✍️ Autor: George Orwell
   📄 Páginas: 328

   Vote com 👍 para SIM ou 👎 para NÃO
   ```

**No terminal do bot:**

```
📝 Executando comando: /enquete - Usuário: seu_nome#1234
✅ Enquete criada: 1984 | ID da mensagem: 1234567890...
```

---

## 👥 PASSO 3: Testar Votação

### Com você mesmo (teste básico):

1. Clique na reação 👍 na mensagem da enquete
2. No terminal do bot, deve aparecer:
   ```
   🔔 seu_nome reagiu com 👍
   ```

### Com outros membros (teste completo):

1. Peça para 2-3 pessoas do servidor votarem
2. Cada vez que alguém votar, o bot registra no terminal
3. Remover reação também funciona:
   ```
   🗑️ nome_usuario removeu a reação 👍
   ```

---

## 👑 PASSO 4: Testar Sistema VIP

### Adicionar um usuário VIP:

```
/mensalista adicionar usuario:@seu_nome
```

**O que deve acontecer:**

- Bot responde com Embed verde
- Mensagem: "✅ MENSALISTA ADICIONADO"
- Texto: "Seus votos agora contam como peso 2 (dobrado!) 📈"

**No terminal:**

```
✅ Mensalista adicionado: seu_nome (123456789...)
```

**Verificar se salvou:**
Abra o arquivo `vips.json` - deve conter:

```json
{
  "vips": ["123456789123456789"]
}
```

### Listar VIPs:

```
/mensalista listar
```

**O que deve acontecer:**

- Bot lista todos os membros VIP
- Mostra IDs e nomes

---

## 🏁 PASSO 5: Testar /encerrar (ou Botão!)

⚠️ **IMPORTANTE:** Você deve ser **administrador** do servidor para encerrar votações!

Se não for admin, receberá erro: "❌ Permissão negada! Apenas administradores..."

### ✨ NOVO: Usar Botão (Muito Mais Fácil!)

A enquete agora tem um **botão de encerramento integrado**!

**Simplesmente:**

1. Na mensagem da enquete, procure pelo botão: **🛑 Encerrar Votação**
2. Clique nele (você precisa ser admin!)
3. O resultado aparece instantaneamente!

**Se você NÃO for admin:**

```
❌ Permissão negada!
Apenas administradores podem encerrar votações.
```

**Vantagens:**

- ✅ Sem copiar ID
- ✅ Sem digitar comando
- ✅ 0% chance de erro
- ✅ Resultado imediato
- ✅ Protegido (apenas admin)

---

### 🔧 Método Alternativo: Comando `/encerrar`

Se preferir usar o comando manual (ambos funcionam!):

#### Verificação de Permissão

Discord mostrará que o comando está **desabilitado** se você não for admin.
Admin vê o comando normalmente.

#### Obter ID da Mensagem:

1. **Habilitar Developer Mode no Discord:**
   - User Settings (⚙️)
   - Advanced
   - ✅ Developer Mode

2. **Copiar Message ID:**
   - Clique direito na mensagem da enquete
   - "Copy Message ID"
   - Cole em algum lugar temporariamente

#### Encerrar a votação:

```
/encerrar mensagem_id:COLE_O_ID_AQUI
```

---

## 📊 Resultado (Igual em Ambos os Métodos)\*\*

Bot responde com Embed mostrando:

```
📊 RESULTADO FINAL DA VOTAÇÃO 📊

Votação encerrada para: 1984

📖 Livro: 1984
✍️ Autor: George Orwell
📄 Páginas: 328

👍 Votos Sim: X pontos
👎 Votos Não: Y pontos

🏆 RESULTADO: ✅ LIVRO APROVADO!

Total de participantes: Z
Membros VIP contam como peso 2
```

**No terminal:**

```
✅ Votação finalizada: 1984 | Resultado: ✅ LIVRO APROVADO!
```

**Verificar histórico:**
Abra o arquivo `historico-votacoes.json` (criado automaticamente):

```json
[
  {
    "livro": "1984",
    "autor": "George Orwell",
    "paginas": 328,
    "votosPositivos": 3,
    "votosNegativos": 1,
    "resultado": "✅ LIVRO APROVADO!",
    "participantes": 2,
    "dataCriacao": "2026-02-25T...",
    "dataFinalizacao": "2026-02-25T..."
  }
]
```

---

## 🧮 PASSO 6: Validar Sistema de Pesos

Este é o **teste crítico** para verificar se o peso está funcionando!

### Cenário de Teste:

1. **Criar nova enquete:**

   ```
   /enquete livro:"Teste de Pesos" autor:"Autor Teste" paginas:100
   ```

2. **Adicionar 1 membro VIP:**

   ```
   /mensalista adicionar usuario:@amigo1
   ```

3. **Pedir para votarem:**
   - `@amigo1` (VIP): Vote 👍
   - `@amigo2` (comum): Vote 👎
   - Você (se não é VIP): Vote 👎

4. **Encerrar:**

   ```
   /encerrar mensagem_id:ID_DA_MENSAGEM
   ```

5. **Resultado esperado:**

   ```
   👍 Votos Sim: 2 pontos (1 VIP)
   👎 Votos Não: 2 pontos (2 comuns)

   🏆 RESULTADO: 🤝 EMPATE!
   ```

**Confirmação:**

- 1 VIP votou SIM = 2 pontos
- 2 comuns votaram NÃO = 1+1 = 2 pontos
- EMPATE! ✅ Sistema de pesos funcionando!

---

## 🎯 PASSO 7: Testar Comando /iniciar (Opcional)

Este comando é opcional, mas vale testar:

```
/iniciar mensagem_id:ID_DA_MENSAGEM
```

**O que deve acontecer:**

- Bot responde com Embed verde
- Mensagem: "✅ VOTAÇÃO INICIADA"
- Status: "🟢 VOTAÇÃO ATIVA"

**No terminal:**

```
🟢 Votação iniciada: 1234567890...
```

---

## ✅ CHECKLIST DE TESTE COMPLETO

Execute todos esses testes para validar o bot:

- [ ] Bot inicia sem erros
- [ ] `/enquete` cria enquete formatada
- [ ] Reações 👍 e 👎 aparecem automaticamente
- [ ] Votar em 👍 registra no terminal
- [ ] Votar em 👎 registra no terminal
- [ ] Remover reação registra no terminal
- [ ] `/mensalista adicionar` adiciona VIP
- [ ] `vips.json` atualiza com o ID
- [ ] `/mensalista listar` mostra VIPs
- [ ] `/mensalista remover` remove VIP
- [ ] `/encerrar` calcula votos corretamente
- [ ] Resultado mostra pontos (não só contagem)
- [ ] Membros VIP contam como peso 2
- [ ] Membros comuns contam como peso 1
- [ ] `historico-votacoes.json` é criado
- [ ] Histórico contém dados da votação

---

## 🐛 Problemas Comuns Durante Teste

### Bot não responde aos comandos

**Causa:** Comandos não registrados ou TOKEN incorreto
**Solução:**

```bash
node deploy-commands.js
node index.js
```

### Reações não contam

**Causa:** Message Content Intent não habilitado
**Solução:**

1. Discord Developer Portal
2. Bot → Privileged Gateway Intents
3. ✅ Message Content Intent
4. Save Changes
5. Reiniciar bot

### "Enquete não encontrada"

**Causa:** ID da mensagem incorreto
**Solução:**

1. Copie o ID novamente (botão direito → Copy Message ID)
2. Certifique-se de estar copiando ID da mensagem correta

### Votos não contam dobrado para VIP

**Causa 1:** Usuário não está em vips.json
**Solução:** Execute `/mensalista listar` para verificar

**Causa 2:** Usuário votou ANTES de ser adicionado como VIP
**Solução:** Peso é determinado no momento do voto. Se usuário já votou,
precisa remover e adicionar reação novamente

### Bot desconecta sozinho

**Causa:** Token expirou ou foi regenerado
**Solução:**

1. Regenere token no Developer Portal
2. Atualize .env com novo token
3. Reinicie bot

---

## 📸 Exemplo de Teste Bem-Sucedido

### Terminal do Bot:

```
✅ Comando carregado: encerrar
✅ Comando carregado: iniciar
✅ Comando carregado: mensalista
✅ Comando carregado: enquete

✅ LittleBoatPoll está ONLINE como LittleBoatPoll#1234!
📊 Gerenciador de Clube do Livro iniciado

📝 Executando comando: /enquete - Usuário: admin#1234
✅ Enquete criada: 1984 | ID da mensagem: 1234567890...
🔔 usuario1 reagiu com 👍
🔔 usuario2 reagiu com 👎
📝 Executando comando: /mensalista - Usuário: admin#1234
✅ Mensalista adicionado: usuario1 (123456789...)
📝 Executando comando: /encerrar - Usuário: admin#1234
✅ Votação finalizada: 1984 | Resultado: ✅ LIVRO APROVADO!
```

### Discord (Canal):

```
@você usou /enquete
📚 NOVA ENQUETE - CLUBE DO LIVRO 📚
[Embed formatado com livro, autor, páginas]
[Reações 👍 👎]

@você usou /mensalista adicionar
✅ MENSALISTA ADICIONADO
[Embed confirmando]

@você usou /encerrar
📊 RESULTADO FINAL DA VOTAÇÃO 📊
[Embed com resultado e pontos]
```

---

## 🎉 Teste Concluído!

Se todos os testes passaram, parabéns! 🎉

Seu bot está 100% funcional e pronto para uso no Clube do Livro!

---

## 📊 Próximos Passos

Após validar que tudo funciona:

1. **Uso regular:**
   - Deixe o bot rodando (use PM2 ou similar para produção)
   - Crie enquetes semanais para o clube
   - Gerencie membros VIP conforme necessário

2. **Melhorias:**
   - Adicione mais comandos personalizados
   - Implemente estatísticas
   - Adicione banco de dados persistente

3. **Manutenção:**
   - Consulte `historico-votacoes.json` periodicamente
   - Faça backup de `vips.json`
   - Monitore logs do terminal

---

**Boa sorte com seu Clube do Livro! 📚❤️**
