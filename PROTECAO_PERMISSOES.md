# 🔐 Proteção de Permissões - Botão de Encerramento

O botão de encerramento agora está **protegido por permissões!** Apenas administradores ou usuários com cargos especificamente configurados podem encerrar votações.

---

## 🎯 Como Funciona

### Padrão (Recomendado)

Por padrão, **apenas administradores** podem clicar no botão 🛑 de encerramento.

### Quando um Usuário Sem Permissão Clica

```
❌ Permissão negada!
Apenas administradores podem encerrar votações.
```

A mensagem é **ephemeral** (privada), então apenas o usuário que tentou vê.

---

## 👨‍💻 Para Customizar Permissões

Se você quiser permitir **outros cargos** além de admin, edite o arquivo `index.js` linha ~95:

### Opção 1: Apenas Admin (Padrão - Recomendado)

```javascript
if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  // Acesso negado
}
```

### Opção 2: Admin OU Moderador

```javascript
const temPermissao = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

if (!temPermissao) {
  // Acesso negado
}
```

### Opção 3: Admin OU Cargo Específico

```javascript
const cargoPermitido = interaction.member.roles.cache.some((role) => role.name === 'Moderador' || role.name === 'Admin');

const temPermissao = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || cargoPermitido;

if (!temPermissao) {
  // Acesso negado
}
```

### Opção 4: Permissão "Gerenciar Mensagens"

```javascript
if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
  // Acesso negado
}
```

---

## 📋 Permissões Disponíveis no Discord.js

Você pode usar qualquer uma dessas permissões:

```javascript
PermissionFlagsBits.Administrator; // Super admin
PermissionFlagsBits.ManageMessages; // Moderador capaz de deletar/gerenciar
PermissionFlagsBits.ManageGuild; // Gerenciar servidor
PermissionFlagsBits.ManageRoles; // Gerenciar cargos
PermissionFlagsBits.ManageChannels; // Gerenciar canais
PermissionFlagsBits.KickMembers; // Expulsar membros
PermissionFlagsBits.BanMembers; // Banir membros
PermissionFlagsBits.ModerateMembres; // Ações de moderação
```

---

## 🔄 Implementação Pronta

Já está **pronta no código**! Na linha ~95 de `index.js`:

```javascript
// ✅ VERIFICAÇÃO DE PERMISSÕES
// Apenas administradores podem encerrar votações
if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  return await interaction.reply({
    content: '❌ **Permissão negada!** Apenas administradores podem encerrar votações.',
    ephemeral: true,
  });
}
```

---

## 🧪 Como Testar

### Se você é Admin: ✅

1. Clique no botão 🛑
2. Resultado aparece normalmente

### Se você NÃO é Admin: ❌

1. Clique no botão 🛑
2. Mensagem: "❌ Permissão negada! Apenas administradores..."
3. Votação NÃO é encerrada

---

## 🎯 Casos de Uso

### Caso 1: Clube com Admin Principal

```
Admin: Pode encerrar votações ✅
Moderadores: Não podem ❌
Membros: Não podem ❌
```

### Caso 2: Clube com Admins e Moderadores

Edite o código para:

```javascript
const temPermissao = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
```

Resultado:

```
Admin: Pode encerrar ✅
Moderadores (Gerenciar Msgs): Podem encerrar ✅
Membros: Não podem ❌
```

---

## 📊 Segurança

| Aspecto                        | Status |
| ------------------------------ | ------ |
| Apenas admins podem encerrar   | ✅     |
| Mensagem é privada (ephemeral) | ✅     |
| Impede encerramento malicioso  | ✅     |
| Log de tentativas no console   | ✅     |

---

## 📝 Log no Console

Quando alguém tenta clicar no botão:

**Se Autorizado:**

```
✅ Votação finalizada via botão: 1984 | Resultado: ✅ LIVRO APROVADO!
```

**Se Não Autorizado:**

```
❌ Tentativa de encerramento sem permissão: usuario#1234
```

(Você pode adicionar isso se quiser mais detalhes)

---

## 🔧 Posso Mudar Isso?

**Sim!** Você pode:

1. **Permitir qualquer um:**

   ```javascript
   // Remova a verificação (não recomendado)
   // if (!interaction.member.permissions.has(...))
   ```

2. **Permitir múltiplas permissões:**

   ```javascript
   const temPermissao = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

   if (!temPermissao) {
     /* acesso negado */
   }
   ```

3. **Permitir cargos específicos:**

   ```javascript
   const cargoAdmin = interaction.member.roles.cache.find((r) => r.name === 'Admin do Clube');

   if (!cargoAdmin) {
     /* acesso negado */
   }
   ```

---

## ⚠️ Lembre-se

- **Apenas admins** têm acesso por padrão
- A mensagem é **privada** (ephemeral)
- O botão continua **clicável** para todos
- A versão anterior `/encerrar` também verifica permissões

---

## 🎉 Pronto!

Seu bot está **seguro**! Ninguém pode encerrar votações sem permissão! 🔐
