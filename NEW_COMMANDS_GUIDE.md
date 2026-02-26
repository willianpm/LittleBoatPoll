# 🆕 Novos Comandos - Gerenciamento Individual de Opções

## 📋 Visão Geral

Agora você pode **adicionar** e **remover** opções individualmente sem precisar recriar toda a lista!

---

## 🎯 Novos Comandos

### 1️⃣ **Adicionar Opções**

```
/rascunho adicionar-opcao
  id: [ID_DO_RASCUNHO]
  opcoes: Nova Opção 1, Nova Opção 2, Nova Opção 3
```

**O que faz:**

- ✅ Adiciona novas opções **sem remover** as existentes
- ✅ Valida se há duplicatas
- ✅ Valida o limite de 20 opções do Discord
- ✅ Ajusta automaticamente max_votos se necessário

**Exemplo:**

```
Rascunho atual: Livro A, Livro B, Livro C

/rascunho adicionar-opcao
  id: ABC12345
  opcoes: Livro D, Livro E

Resultado: Livro A, Livro B, Livro C, Livro D, Livro E
```

---

### 2️⃣ **Remover Opção**

```
/rascunho remover-opcao
  id: [ID_DO_RASCUNHO]
  opcao: [TEXTO_DA_OPÇÃO ou NÚMERO]
```

**O que faz:**

- ✅ Remove uma opção específica pelo **texto exato**
- ✅ Remove uma opção específica pelo **número** (1, 2, 3...)
- ✅ Valida que sempre ficarão pelo menos 2 opções
- ✅ Ajusta automaticamente max_votos se necessário

**Exemplo por Texto:**

```
Rascunho atual: Livro A, Livro B, Livro C

/rascunho remover-opcao
  id: ABC12345
  opcao: Livro B

Resultado: Livro A, Livro C
```

**Exemplo por Número:**

```
Rascunho atual: Livro A, Livro B, Livro C

/rascunho remover-opcao
  id: ABC12345
  opcao: 2

Resultado: Livro A, Livro C (remove a 2ª opção)
```

---

## 📊 Fluxo de Uso Completo

### **Cenário 1: Adicionar Opções Progressivamente**

```
1. /rascunho criar
   titulo: "Votação de Livros"
   opcoes: "Livro A, Livro B"
   max_votos: 1

   [ID: ABC12345]

2. /rascunho adicionar-opcao
   id: ABC12345
   opcoes: "Livro C, Livro D"

   ✅ Agora tem: Livro A, Livro B, Livro C, Livro D

3. /rascunho adicionar-opcao
   id: ABC12345
   opcoes: "Livro E"

   ✅ Agora tem: Livro A, Livro B, Livro C, Livro D, Livro E

4. /rascunho publicar
   id: ABC12345
```

---

### **Cenário 2: Remover Opções Indesejadas**

```
1. /rascunho criar
   titulo: "Teste"
   opcoes: "Opção 1, Opção 2, Opção 3, Opção 4"
   max_votos: 2

   [ID: XYZ789]

2. /rascunho remover-opcao
   id: XYZ789
   opcao: "Opção 2"

   ✅ Agora tem: Opção 1, Opção 3, Opção 4

3. /rascunho remover-opcao
   id: XYZ789
   opcao: 3

   ✅ Agora tem: Opção 1, Opção 3 (removeu a 3ª que era "Opção 4")
```

---

### **Cenário 3: Combinar Adicionar e Remover**

```
1. /rascunho criar
   titulo: "Lista Final"
   opcoes: "Item A, Item B, Item C"
   max_votos: 1

   [ID: QWE456]

2. /rascunho adicionar-opcao
   id: QWE456
   opcoes: "Item D, Item E"

   ✅ Tem: Item A, Item B, Item C, Item D, Item E

3. /rascunho remover-opcao
   id: QWE456
   opcao: "Item B"

   ✅ Tem: Item A, Item C, Item D, Item E

4. /rascunho adicionar-opcao
   id: QWE456
   opcoes: "Item F"

   ✅ Final: Item A, Item C, Item D, Item E, Item F
```

---

## ✅ Validações Implementadas

### **Adicionar Opções:**

- ❌ Não permite duplicatas
- ❌ Não permite ultrapassar 20 opções (limite Discord)
- ✅ Ajusta max_votos automaticamente se necessário
- ✅ Valida entrada vazia

### **Remover Opção:**

- ❌ Não permite remover se ficarem menos de 2 opções
- ❌ Não permite remover opção que não existe
- ✅ Aceita número (1-based) ou texto
- ✅ Case-insensitive (não diferencia maiúsculas/minúsculas)
- ✅ Ajusta max_votos automaticamente se necessário

---

## 🎨 Exemplos de Mensagens

### **Sucesso ao Adicionar:**

```
✅ Opções Adicionadas!

ID: ABC12345
Título: Votação de Livros
Opções Adicionadas: Livro D, Livro E
Total de Opções: 5
Todas as Opções: Livro A, Livro B, Livro C, Livro D, Livro E

Status: 📝 Rascunho
```

### **Sucesso ao Remover:**

```
✅ Opção Removida!

ID: ABC12345
Título: Votação de Livros
Opção Removida: Livro B
Total de Opções: 4
Opções Restantes: Livro A, Livro C, Livro D, Livro E

Status: 📝 Rascunho
```

### **Erro: Duplicata:**

```
❌ Erro! As seguintes opções já existem no rascunho: Livro A, Livro C
```

### **Erro: Limite de Opções:**

```
❌ Erro! O Discord limita a 20 reações por mensagem.
Total de opções: 22. Remova 2 opção(ões).
```

### **Erro: Opção Não Encontrada:**

```
❌ Erro! Opção "Livro Z" não encontrada.

Opções disponíveis:
1. Livro A
2. Livro B
3. Livro C
```

### **Erro: Mínimo de Opções:**

```
❌ Erro! A enquete precisa ter pelo menos 2 opções.
Não é possível remover mais opções.
```

---

## 🔐 Permissões

| Comando                     | Quem pode executar |
| --------------------------- | ------------------ |
| `/rascunho adicionar-opcao` | Criador ou Admin   |
| `/rascunho remover-opcao`   | Criador ou Admin   |

---

## 💡 Dicas de Uso

✅ **Adicionar múltiplas opções de uma vez:**

```
/rascunho adicionar-opcao
  opcoes: Opção 1, Opção 2, Opção 3, Opção 4
```

✅ **Remover por número é mais rápido:**

```
/rascunho exibir id: ABC123
# Vê: 1. Item A, 2. Item B, 3. Item C

/rascunho remover-opcao
  opcao: 2
# Remove "Item B"
```

✅ **Use /rascunho exibir para confirmar:**

```
/rascunho adicionar-opcao ...
/rascunho exibir id: ABC123
# Confirma as mudanças
```

✅ **Combine com outros comandos de edição:**

```
/rascunho adicionar-opcao ...
/rascunho editar ... (mudar título)
/rascunho remover-opcao ...
/rascunho exibir ... (verificar)
/rascunho publicar ...
```

---

## ⚠️ Comportamentos Importantes

1. **Max Votos Automático:**
   - Se `max_votos > número de opções`, o sistema ajusta automaticamente
   - Exemplo: tinha 5 opções com max_votos=3, removeu 3 opções → max_votos vira 2

2. **Case-Insensitive:**
   - "Livro A" = "livro a" = "LIVRO A" (ao remover)

3. **Duplicatas:**
   - Sistema verifica duplicatas de forma case-insensitive
   - "Livro A" e "livro a" são consideradas duplicatas

4. **Números 1-based:**
   - Ao remover por número, use 1 para primeira opção, 2 para segunda, etc.

---

## 📋 Comparação: Antes vs Agora

### **❌ Antes (Modo Antigo):**

```
Rascunho atual: Livro A, Livro B, Livro C

Para adicionar Livro D:
/rascunho editar
  opcoes: Livro A, Livro B, Livro C, Livro D
  (tinha que reescrever tudo!)
```

### **✅ Agora (Modo Novo):**

```
Rascunho atual: Livro A, Livro B, Livro C

Para adicionar Livro D:
/rascunho adicionar-opcao
  opcoes: Livro D
  (só adiciona o novo!)
```

---

## 🚀 Próximos Passos

1. **Fazer Deploy:**

   ```bash
   node deploy-commands.js
   npm start
   ```

2. **Testar:**

   ```
   /rascunho criar ...
   /rascunho adicionar-opcao ...
   /rascunho remover-opcao ...
   ```

3. **Usar em Produção:**
   - Crie seus rascunhos
   - Adicione/remova opções conforme necessário
   - Publique quando pronto!

---

## 📖 Documentação Relacionada

- **Guia Completo:** [DRAFT_POLLS_GUIDE.md](DRAFT_POLLS_GUIDE.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Exemplos de Teste:** [TEST_DRAFT_POLLS.js](TEST_DRAFT_POLLS.js)

---

**Versão:** 1.2  
**Data:** 26 de fevereiro de 2026  
**Status:** ✅ Implementado e testado
