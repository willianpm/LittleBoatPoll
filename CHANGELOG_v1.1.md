# 🆕 MUDANÇAS v1.1 - Sistema de Rascunhos de Enquetes

## O que foi adicionado?

### 🎯 Funcionalidade Principal: Rascunhos de Enquetes

#### Adicionado:

- **Novo arquivo:** [`commands/draft.js`](commands/draft.js)
- **Novo arquivo de dados:** `draft-polls.json`
- **Nova documentação:** [`DRAFT_POLLS_GUIDE.md`](DRAFT_POLLS_GUIDE.md)

#### Modificações no `index.js`:

- Adicionada Map `client.draftPolls` para armazenar rascunhos em memória
- Função `saveDraftPolls()` para salvar rascunhos em arquivo
- Função `loadDraftPolls()` para carregar rascunhos ao iniciar o bot
- Adicionada inicialização de `draft-polls.json` na função `ensureDataFiles()`
- Chamada a `loadDraftPolls()` na inicialização

---

## 📋 Comandos Adicionados

### `/rascunho criar`

Cria um novo rascunho de enquete sem publicá-lo.

**Parâmetros:**

- `titulo` (obrigatório): Título da enquete
- `opcoes` (obrigatório): Opções separadas por vírgula
- `max_votos` (obrigatório): Máximo de votos por pessoa
- `peso_mensalista` (opcional): Mensalistas têm peso 2?

**Retorno:** ID único do rascunho

---

### `/rascunho editar`

Edita um rascunho existente.

**Parâmetros:**

- `id` (obrigatório): ID do rascunho
- `titulo` (opcional): Novo título
- `opcoes` (opcional): Novas opções
- `max_votos` (opcional): Novo máximo de votos
- `peso_mensalista` (opcional): Alterar peso

**Características:**

- Edita apenas os campos fornecidos
- Permite múltiplas edições
- Atualiza timestamp de "Editado em"

---

### `/rascunho listar`

Lista todos os rascunhos disponíveis.

**Retorno:**

- ID, Título, Número de opções, Criador, Data de criação
- Máximo 10 itens por página

---

### `/rascunho exibir`

Mostra detalhes completos de um rascunho.

**Parâmetros:**

- `id` (obrigatório): ID do rascunho

**Retorno:**

- Todas as informações do rascunho (título, opções, configurações, datas)

---

### `/rascunho publicar`

Converte um rascunho em enquete ativa.

**Parâmetros:**

- `id` (obrigatório): ID do rascunho
- `canal` (opcional): Canal onde publicar (padrão: canal atual)

**O que acontece:**

1. Rascunho é convertido em enquete ativa
2. Mensagem é enviada para o canal
3. Reações de emoji são adicionadas
4. A enquete começa a aceitar votos
5. Rascunho é removido

---

### `/rascunho deletar`

Remove um rascunho permanentemente.

**Parâmetros:**

- `id` (obrigatório): ID do rascunho

**Aviso:** A ação não pode ser desfeita!

---

## 🔄 Fluxo de Uso

```
1. /rascunho criar
   └─ Recebe ID único

2. /rascunho editar (múltiplas vezes)
   └─ Ajusta título, opções, configurações

3. /rascunho exibir
   └─ Confirma tudo antes de publicar

4. /rascunho publicar
   └─ Converte em enquete ativa
   └─ Começa a aceitar votos
```

---

## 📊 Estrutura de Dados

### `draft-polls.json`

```json
[
  {
    "id": "A1B2C3D4",
    "titulo": "Qual livro?",
    "opcoes": ["Livro A", "Livro B", "Livro C"],
    "maxVotos": 2,
    "usarPesoMensalista": true,
    "criadorId": "user_id",
    "criadorNome": "username",
    "criadoEm": "2026-02-26T10:30:00.000Z",
    "editadoEm": "2026-02-26T11:45:00.000Z",
    "status": "rascunho"
  }
]
```

---

## 🔐 Permissões

| Ação              | Quem pode fazer           |
| ----------------- | ------------------------- |
| Criar rascunho    | Admin ou Cargo Autorizado |
| Editar rascunho   | Criador ou Admin          |
| Listar rascunhos  | Qualquer um               |
| Exibir detalhes   | Qualquer um               |
| Publicar rascunho | Criador ou Admin          |
| Deletar rascunho  | Criador ou Admin          |

---

## ✅ Validações

- **Opções:** Mínimo 2, Máximo 20 (limitação do Discord)
- **Máximo de votos:** Não pode exceder o número de opções
- **IDs:** Únicos e aleatórios (8 caracteres hexadecimais)
- **Edições:** Cada campo é editável independentemente
- **Publicação:** Remove automaticamente o rascunho

---

## 🎯 Casos de Uso

### Caso 1: Preparar Enquete com Antecedência

```
1. Segunda: /rascunho criar
2. Terça a Quinta: /rascunho editar (ajustes), /rascunho exibir (verificação)
3. Sexta: /rascunho publicar (ao vivo!)
```

### Caso 2: Múltiplas Versões

```
1. /rascunho criar "Votação v1"
2. Testa, vê que não gostou
3. /rascunho criar "Votação v2" (versão melhorada)
4. Publica a v2
5. /rascunho deletar (ID da v1)
```

### Caso 3: Edição Colaborativa

```
1. Criador 1: /rascunho criar
2. Criador 1 ou Admin: /rascunho editar (ajustes)
3. Criador 1 ou Admin: /rascunho exibir (confirma)
4. Criador 1 ou Admin: /rascunho publicar (publica)
```

---

## 📝 Diferenças entre Rascunho e Enquete Ativa

| Aspecto                | Rascunho           | Enquete Ativa                 |
| ---------------------- | ------------------ | ----------------------------- |
| Local de armazenamento | `draft-polls.json` | `active-polls.json`           |
| Aceita votos?          | ❌ Não             | ✅ Sim                        |
| Pode ser editado?      | ✅ Sim             | ❌ Não                        |
| Visível no servidor?   | ❌ Não (privado)   | ✅ Sim (canal específico)     |
| Pode ser deletado?     | ✅ Sim             | ❌ Não (permanece como ativa) |
| ID gerado por          | Comando            | ID da mensagem Discord        |

---

## 🧪 Como Testar

1. **Criar um rascunho:**

   ```
   /rascunho criar
   titulo: "Teste"
   opcoes: "Opção 1, Opção 2"
   max_votos: 1
   ```

2. **Listar rascunhos:**

   ```
   /rascunho listar
   ```

3. **Editar o rascunho:**

   ```
   /rascunho editar
   id: [ID_DO_RASCUNHO]
   titulo: "Teste Editado"
   ```

4. **Exibir detalhes:**

   ```
   /rascunho exibir
   id: [ID_DO_RASCUNHO]
   ```

5. **Publicar:**
   ```
   /rascunho publicar
   id: [ID_DO_RASCUNHO]
   ```

---

## 🚀 Próximas Melhorias (Sugestões)

- [ ] Comando para clonar um rascunho existente
- [ ] Comando para visualizar histórico de edições
- [ ] Sistema de comentários/notas no rascunho
- [ ] Exportação de rascunho para modelo (template)
- [ ] Agendamento automático de publicação
- [ ] Controle de acesso por usuário específico
- [ ] Backup automático de rascunhos

---

**Versão:** 1.1  
**Data:** 26 de fevereiro de 2026  
**Compatibilidade:** discord.js v14.25.1+
