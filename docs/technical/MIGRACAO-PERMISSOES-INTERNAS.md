# 🔄 Migração: Sistema de Permissões Interno

## 📋 Resumo das Mudanças

O bot migrou as permissões administrativas de um sistema baseado em **cargos do Discord** para um sistema interno baseado em IDs de usuários. O sistema de mensalistas suporta vínculo automático opcional com o cargo `Mensalistas`.

### ⚠️ Breaking Changes

- ✅ **Não é mais necessário** criar o cargo "Criador de Enquetes" no servidor
- ✅ **Comando `/criadores`** foi descontinuado → Use **`/criador-de-enquete-de-enquete`**
- ✅ **Context Menu** agora gerencia permissões internas (não adiciona cargos)
- ✅ Permissões são salvas em `criadores-internos.json`

---

## 🎯 Por que esta mudança?

### Problemas do Sistema Antigo (Cargos)

❌ Necessário criar cargo manualmente no Discord  
❌ Problemas com hierarquia de cargos  
❌ Cargo podia ser deletado acidentalmente  
❌ Mais complexo de configurar  
❌ Dependência da API de cargos do Discord

### Vantagens do Sistema Novo (Interno)

✅ **Sem configuração no Discord** - funciona imediatamente  
✅ **Mais simples** - apenas adicionar ID do usuário  
✅ **Mais seguro** - não depende de hierarquia  
✅ **Persistente** - não pode ser deletado acidentalmente  
✅ **Flexível** - total controle pelo bot

---

## 🚀 Como Usar o Novo Sistema

### 1. Adicionar um Criador de Enquetes

**Método 1: Comando Slash**

```
/criador-de-enquete adicionar @usuario
```

**Método 2: Context Menu (Botão Direito)**

1. Clique com botão direito no usuário
2. Apps → "Add/Del Criador de Enquetes"

### 2. Remover um Criador

**Método 1: Comando Slash**

```
/criador-de-enquete remover @usuario
```

**Método 2: Context Menu**

- Mesma ação (toggle on/off)

### 3. Listar todos os Criadores

```
/criador-de-enquete listar
```

---

## 🔐 Como Funciona a Verificação de Permissões

O bot verifica permissões na seguinte ordem:

1. ✅ **Administrador do Discord?** → Acesso total
2. ✅ **Dono do servidor?** → Acesso total
3. ✅ **ID está em `criadores-internos.json`?** → Acesso total
4. ❌ **Se nenhum dos acima:** → Apenas pode votar

---

## 📁 Estrutura de Arquivos

### Novo Arquivo: `criadores-internos.json`

```json
{
  "criadores": ["123456789012345678", "987654321098765432"]
}
```

Este arquivo armazena os IDs dos usuários que têm permissões administrativas.

---

## 🔄 Migração de Servidores Existentes

### Se você usava o sistema antigo de cargos:

1. **Identifique quem tem o cargo "Criador de Enquetes"**
2. **Adicione-os ao novo sistema:**
   ```
   /criador-de-enquete adicionar @usuario
   ```
3. **(Opcional) Remova o cargo antigo** do servidor

### ⚠️ Importante

- O arquivo `cargos-criadores.json` ainda existe mas **não é mais usado**
- O comando `/criadores` ainda aparece mas mostra aviso de descontinuação
- Administradores e dono do servidor **sempre terão acesso**, independente do arquivo

---

## 🛠️ Detalhes Técnicos

### Mensalistas por cargo (v2.0.1+)

- Se existir um cargo chamado **Mensalistas** no servidor, o bot faz vínculo automático desse cargo com o papel interno de mensalista.
- O vínculo é resolvido por nome de cargo (case-insensitive) e salvo em `role-bindings.json`.
- O mapeamento é persistido por servidor (`guildId -> roleId`).
- Se o cargo não existir, o bot mantém o comportamento padrão usando `mensalistas.json`.
- O bot não cria nem duplica cargos automaticamente.

### Arquivos Modificados

| Arquivo                              | Mudanças                                                   |
| ------------------------------------ | ---------------------------------------------------------- |
| `utils/permissions.js`               | Verifica criadores internos e cargos autorizados por guild |
| `utils/file-handler.js`              | Adicionadas funções `loadCriadores()` e `saveCriadores()`  |
| `commands/criador-de-enquete.js`     | **NOVO** - Gerencia criadores por ID                       |
| `commands/criadores.js`              | **DESCONTINUADO** - Mostra aviso de migração               |
| `commands/criador-toggle-context.js` | Atualizado para sistema interno                            |

### Novo Arquivo de Dados

- `criadores-internos.json` - Lista de IDs de usuários com permissões

---

## 🔒 Segurança

### Proteções Implementadas

✅ **Não pode remover o último criador**  
✅ **Apenas criadores podem gerenciar outros criadores**  
✅ **Administradores e dono sempre têm acesso**  
✅ **Validação de IDs de usuários**  
✅ **Logs de todas as alterações**

---

## 📊 Comparação: Antes vs Depois

| Aspecto                 | Sistema Antigo (Cargos)     | Sistema Novo (Interno)                |
| ----------------------- | --------------------------- | ------------------------------------- |
| **Setup Inicial**       | Criar cargo no Discord      | Nenhum                                |
| **Adicionar Permissão** | Adicionar cargo ao usuário  | `/criador-de-enquete adicionar @user` |
| **Visibilidade**        | Visível na lista de membros | Apenas no bot                         |
| **Hierarquia**          | Requer configuração         | Não se aplica                         |
| **Persistência**        | Pode ser deletado           | Sempre persiste                       |
| **Comando**             | `/criadores` (com cargo)    | `/criador-de-enquete` (com usuário)   |

---

## ❓ FAQ

### Preciso recriar minhas permissões?

Sim, se você usava o sistema antigo, adicione os usuários novamente com `/criador-de-enquete adicionar`.

### O que acontece com o arquivo `cargos-criadores.json`?

Ele ainda existe mas não é mais usado. Pode ser mantido ou deletado.

### Posso voltar ao sistema de cargos?

Tecnicamente sim (revertendo o código), mas não é recomendado. O sistema interno é mais robusto.

### E se eu quiser que seja visível no servidor?

Você pode criar um cargo decorativo, mas ele não será usado para verificação de permissões.

### Administradores perdem acesso?

Não! Administradores do Discord e o dono do servidor **sempre** têm acesso total.

---

## 🎓 Exemplo Prático

### Cenário: Novo servidor começando do zero

1. **Dono do servidor** inicia o bot
2. Dono usa `/criador-de-enquete adicionar @moderador1`
3. Dono usa `/criador-de-enquete adicionar @moderador2`
4. Agora 3 pessoas podem gerenciar enquetes:
   - Dono (automático)
   - @moderador1 (adicionado internamente)
   - @moderador2 (adicionado internamente)

**Nenhum cargo foi criado! Tudo funciona internamente.**

---

## 📝 Notas Importantes

- ✅ O sistema é **retrocompatível** - comandos antigos mostram aviso
- ✅ **Nenhum dado é perdido** - arquivo antigo é mantido
- ✅ **Migração gradual** - pode testar o novo sistema primeiro
- ✅ **Logs claros** - todas as alterações são registradas no console

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se o arquivo `criadores-internos.json` existe
2. Use `/criador-de-enquete listar` para ver quem tem permissões
3. Administradores sempre podem adicionar criadores
4. Consulte os logs do bot para detalhes de erros

---

**Data da Migração:** Fevereiro 2026  
**Versão:** Sistema de Permissões Interno v2.0
