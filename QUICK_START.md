# ⚡ Quick Start - Rascunhos de Enquetes

## 🚀 Primeiros Passos (5 min)

### 1. Verificar Instalação

```bash
# O bot deve mostrar isso ao iniciar:
✅ LittleBoatPoll está ONLINE
📝 X rascunho(s) de enquete(s) carregado(s)
```

### 2. Criar Seu Primeiro Rascunho

```
/rascunho criar
  titulo: Teste
  opcoes: Opção A, Opção B, Opção C
  max_votos: 1
  peso_mensalista: Não
```

### 3. Ver o ID

Bot responde com o ID do rascunho (ex: `A1B2C3D4`)

### 4. Visualizar

```
/rascunho exibir
  id: A1B2C3D4
```

### 5. Publicar!

```
/rascunho publicar
  id: A1B2C3D4
```

✅ Enquete está ao vivo!

---

## 📋 Comandos Essenciais

| Comando              | Uso                | Quando usar         |
| -------------------- | ------------------ | ------------------- |
| `/rascunho criar`    | Novo rascunho      | Começar enquete     |
| `/rascunho editar`   | Modificar rascunho | Ajustar dados       |
| `/rascunho listar`   | Ver todos          | Procurar rascunho   |
| `/rascunho publicar` | Ativar enquete     | Pronto para votação |
| `/rascunho deletar`  | Remover            | Não precisa mais    |

---

## 💡 Casos Comuns

### Caso: "Criei com título errado"

```
1. /rascunho listar (encontre o ID)
2. /rascunho editar
   id: [ID]
   titulo: Novo Título
3. /rascunho exibir (confirme)
4. /rascunho publicar (publica)
```

### Caso: "Preciso adicionar uma opção"

```
/rascunho editar
  id: [ID]
  opcoes: Opção A, Opção B, Opção C, Opção D
```

### Caso: "Quero mudar para 2 votos"

```
/rascunho editar
  id: [ID]
  max_votos: 2
```

### Caso: "Mudei de ideia, deleta"

```
/rascunho deletar
  id: [ID]
```

---

## ✅ Checklist Antes de Publicar

- [ ] Título está claro?
- [ ] Todas as opções estão corretas?
- [ ] Máximo de votos faz sentido?
- [ ] Peso de mensalistas configurado corretamente?
- [ ] Vai publicar no canal certo?

---

## 📖 Documentação Completa

- **Guia Detalhado:** [DRAFT_POLLS_GUIDE.md](DRAFT_POLLS_GUIDE.md)
- **Histórico de Mudanças:** [CHANGELOG_v1.1.md](CHANGELOG_v1.1.md)
- **Exemplos de Teste:** [TEST_DRAFT_POLLS.js](TEST_DRAFT_POLLS.js)
- **Resumo Técnico:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## ⚠️ Lembre-se

- ❌ Deletar é **permanente**
- ✅ Você pode editar **quantas vezes quiser**
- ✅ Publica em qualquer canal
- ✅ Rascunhos **não aparecem** no servidor
- ⏱️ Pode deixar como rascunho **quanto tempo quiser**

---

## 🆘 Problemas Comuns

**"ID não encontrado"**
→ Use `/rascunho listar` para copiar o ID correto

**"Permissão negada"**
→ Você é admin ou tem cargo autorizado?
→ Confira com `/criadores listar`

**"Mínimo 2 opções"**
→ Adicione pelo menos 2 opções separadas por vírgula

**"Erro ao publicar"**
→ Bot tem permissão de enviar mensagens no canal?

---

**Pronto para começar! 🎉**

Use `/rascunho criar` agora mesmo!
