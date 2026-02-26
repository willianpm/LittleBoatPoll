# 📝 Guia de Enquetes em Rascunho

## Visão Geral

A funcionalidade de **Rascunhos de Enquetes** permite criar e editar enquetes **antes de publicá-las para votação**. Isso significa que você pode:

✅ Criar uma enquete sem abrir a votação imediatamente  
✅ Editar toda a configuração quantas vezes precisar  
✅ Salvar como rascunho indefinidamente  
✅ Publicar quando estiver pronto

---

## Fluxo de Uso

```
1. Criar Rascunho
   ↓
2. Editar (múltiplas vezes se necessário)
   ↓
3. Visualizar Detalhes
   ↓
4. Publicar como Enquete Ativa
   ↓
5. Enquete começa a aceitar votos
```

---

## Comandos Disponíveis

Todos os comandos usam a estrutura `/rascunho [subcomando]`

### 1️⃣ **Criar um Rascunho**

```
/rascunho criar
  • titulo: Nome/Título da enquete (obrigatório)
  • opcoes: Opções separadas por vírgula (obrigatório)
  • max_votos: Número máximo de votos por pessoa (obrigatório)
  • peso_mensalista: Mensalistas têm peso 2? [Sim/Não] (opcional)
```

**Exemplo:**

```
/rascunho criar
  titulo: "Qual livro devemos ler no próximo mês?"
  opcoes: "Brás Cubas, Dom Casmurro, Quincas Borba, Memórias Póstumas"
  max_votos: 2
  peso_mensalista: Sim
```

**Resultado:**

- 📝 Rascunho criado com sucesso
- Recebe um **ID único** (ex: `A1B2C3D4`)
- Salvo em `draft-polls.json`

---

### 2️⃣ **Editar um Rascunho**

```
/rascunho editar
  • id: ID do rascunho (obrigatório)
  • titulo: Novo título (opcional)
  • opcoes: Novas opções (opcional)
  • max_votos: Novo máximo de votos (opcional)
  • peso_mensalista: Alterar peso? (opcional)
```

**Exemplo:**

```
/rascunho editar
  id: A1B2C3D4
  titulo: "Qual livro escolhemos para fevereiro?"
  max_votos: 1
```

**Características:**

- ✅ Edita apenas os campos que você especificar
- ✅ Os campos não mencionados **mantêm os valores anteriores**
- ✅ Atualiza o timestamp de "Editado em"
- ✅ Permissões: Criador do rascunho ou Administrador

---

### 3️⃣ **Listar Rascunhos**

```
/rascunho listar
  (sem parâmetros)
```

**Resultado:**

- 📝 Lista todos os rascunhos disponíveis
- Mostra: ID, Título, Número de opções, Criador, Data de criação
- Limitado a 10 por página

---

### 4️⃣ **Exibir Detalhes de um Rascunho**

```
/rascunho exibir
  • id: ID do rascunho (obrigatório)
```

**Exemplo:**

```
/rascunho exibir
  id: A1B2C3D4
```

**Resultado:**

- Mostra todos os detalhes do rascunho:
  - Título e opções
  - ID único
  - Criador
  - Máximo de votos e peso
  - Data de criação e última edição
  - Status: 📝 Rascunho

---

### 5️⃣ **Publicar um Rascunho**

```
/rascunho publicar
  • id: ID do rascunho (obrigatório)
  • canal: Canal onde publicar (opcional - usa canal atual se não especificado)
```

**Exemplo:**

```
/rascunho publicar
  id: A1B2C3D4
  canal: #votações
```

**O que acontece:**

1. ✅ Rascunho é convertido em Enquete Ativa
2. ✅ Mensagem é enviada para o canal escolhido
3. ✅ Reações de emoji são adicionadas automaticamente
4. ✅ A enquete começa a aceitar votos
5. ✅ Rascunho é **removido** da lista de rascunhos
6. ✅ Agora a enquete é gerenciada como enquete ativa normal

**Permissões:** Criador do rascunho ou Administrador

---

### 6️⃣ **Deletar um Rascunho**

```
/rascunho deletar
  • id: ID do rascunho (obrigatório)
```

**Exemplo:**

```
/rascunho deletar
  id: A1B2C3D4
```

**Resultado:**

- ❌ Rascunho é permanentemente removido
- Não pode ser recuperado
- Apenas criador ou admin podem deletar

---

## 📊 Exemplos Práticos

### Exemplo 1: Criar e Publicar Imediatamente

```
1. /rascunho criar
   titulo: "Votação do Mês"
   opcoes: "Opção A, Opção B, Opção C"
   max_votos: 1
   peso_mensalista: Não

2. Bot retorna ID: 12ABef99

3. /rascunho publicar
   id: 12ABef99
   canal: #votações

✅ Enquete ao vivo e aceitando votos!
```

### Exemplo 2: Criar, Editar e Publicar Depois

```
1. /rascunho criar
   titulo: "Enquete Teste"
   opcoes: "Sim, Não, Talvez"
   max_votos: 1
   peso_mensalista: Não

2. Recebe ID: XyZ789ab

3. (Depois decides mudar o título)
   /rascunho editar
   id: XyZ789ab
   titulo: "Enquete Importante - Votação"

4. (Muda o máximo de votos)
   /rascunho editar
   id: XyZ789ab
   max_votos: 2

5. (Para tudo ok, publica)
   /rascunho publicar
   id: XyZ789ab

✅ Enquete publicada com todas as modificações!
```

### Exemplo 3: Edição de Opções

```
1. /rascunho criar
   titulo: "Escolha de Livro"
   opcoes: "Livro A, Livro B, Livro C"
   max_votos: 2

2. Recebe ID: LiVro123

3. (Realiza edição das opções)
   /rascunho editar
   id: LiVro123
   opcoes: "Livro A, Livro B, Livro C, Livro D, Livro E"

4. (Visualiza para confirmar)
   /rascunho exibir
   id: LiVro123

✅ Rascunho agora com 5 opções!
```

---

## 📁 Estrutura de Dados

### Arquivo: `draft-polls.json`

```json
[
  {
    "id": "A1B2C3D4",
    "titulo": "Qual livro devemos ler?",
    "opcoes": ["Brás Cubas", "Dom Casmurro", "Quincas Borba"],
    "maxVotos": 2,
    "usarPesoMensalista": true,
    "criadorId": "123456789",
    "criadorNome": "NomeDoUsuário",
    "criadoEm": "2026-02-26T10:30:00.000Z",
    "editadoEm": "2026-02-26T11:45:00.000Z",
    "status": "rascunho"
  }
]
```

### Arquivo: `active-polls.json`

Após publicação, a enquete ativa conterá os mesmos dados pero com status `"ativa"`.

---

## 🔐 Permissões

| Ação              | Quem pode fazer           |
| ----------------- | ------------------------- |
| Criar Rascunho    | Admin ou Cargo Autorizado |
| Editar Rascunho   | Criador ou Admin          |
| Listar Rascunhos  | Qualquer um               |
| Exibir Detalhes   | Qualquer um               |
| Publicar Rascunho | Criador ou Admin          |
| Deletar Rascunho  | Criador ou Admin          |

---

## ⚠️ Regras e Limitações

1. **Número de Opções:**
   - Mínimo: 2 opções
   - Máximo: 20 opções (limitação do Discord com reações)

2. **Máximo de Votos:**
   - Não pode ser maior que o número de opções
   - Mínimo: 1 voto

3. **IDs de Rascunho:**
   - Únicos e aleatórios
   - Formato: 8 caracteres hexadecimais (ex: `A1B2C3D4`)
   - Nunca se repetem

4. **Edições:**
   - Você pode editar um rascunho **quantas vezes quiser**
   - Após deletar, não pode ser recuperado
   - Após publicar, o rascunho é **removido**

5. **Publicação:**
   - Apenas um rascunho por vez
   - Pode escolher qual canal publicar
   - Converte para enquete ativa imediatamente

---

## 🚀 Dicas de Uso

✅ **Boas práticas:**

- Crie rascunhos durante a semana e publique no fim de semana
- Use `/rascunho listar` para ver todos os rascunhos antes de criar um novo
- Sempre use `/rascunho exibir` para confirmar antes de publicar
- Mantenha títulos descritivos para facilitar identificação

❌ **Evite:**

- Não deletar rascunhos sem ter certeza (não há recuperação)
- Não publicar sem revisar os detalhes
- Não esquecer o máximo de votos - pode causar confusão

---

## 📞 Suporte

Se encontrar algum problema:

1. Verifique o ID do rascunho (`/rascunho listar`)
2. Confirme suas permissões (Admin ou Cargo Autorizado)
3. Verifique a validação dos dados (opções mínimas/máximas)

---

**Última atualização:** 26 de fevereiro de 2026  
**Versão:** 1.0
