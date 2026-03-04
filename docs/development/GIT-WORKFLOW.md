# Git Workflow - Little Boat Poll

Nosso processo de contribuição usa **GitHub Flow** - simples, iterativo, ideal para equipes pequenas.

## Resumo Visual

```
origin/develop  ← main branch de desenvolvimento
    ↑
    │ (criar feature branch)
    │
feature/sua-feature
    │
    │ (editar código)
    ├─ git add / commit
    │
    │ (push e criar PR)
    ├─ Create Pull Request
    │
    │ (review automático: testes + linter)
    ├─ GitHub Actions
    │
    │ (review manual + aprovação)
    ├─ Code Review
    │
    │ (merge para develop)
    └─→ Merge to develop
```

## Workflow Passo-a-Passo

### 1️⃣ Configure Git Local

Se for primeira vez no repositório:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"
```

### 2️⃣ Crie uma Feature Branch

Sempre a partir de `develop`:

```bash
git checkout develop          # Mude para develop
git pull origin develop       # Atualize com últimas mudanças
git checkout -b feature/meu-feature-descritivo
```

**Convenção de nome da branch:**

- `feature/adicionar-validacao-email` - Nova funcionalidade
- `bugfix/corrigir-votacao-duplicada` - Correção de bug
- `docs/melhorar-setup-guide` - Apenas documentação
- `refactor/simplificar-utils` - Code cleanup

**❌ Evite:**

- `feature/test` - Muito vago
- `feature/corrige_tudo` - Muito amplo
- `test123` - Sem contexto

### 3️⃣ Escreva Código e Teste

Faça suas mudanças:

```bash
# Editar arquivos...

# Testar localmente
npm test                      # Testes devem passar
npm run lint                  # Linter deve passar
npm run format                # Auto-formata código
```

**Commitando código:**

```bash
git add .                           # Ou git add arquivo_específico

git commit -m "feat: descrição curta"
# Ou
git commit -m "fix: corrigido bug em validação"
git commit -m "docs: atualizado SETUP.md"
git commit -m "test: adiciona testes unitários"
git commit -m "refactor: simplifica função"
git commit -m "perf: otimiza performance"
```

**Prefixos de commit permitidos:**

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `test:` - Testes
- `refactor:` - Refatoração (sem mudança de comportamento)
- `perf:` - Melhoria de performance

### 4️⃣ Push para o Repositório

```bash
git push origin feature/meu-feature-descritivo
```

**Primeira vez nesta branch:**

```
The upstream branch of your current branch does not match...
git push -u origin feature/meu-feature-descritivo
```

### 5️⃣ Crie uma Pull Request (PR)

No GitHub:

1. Vá para https://github.com/seu-repo/LittleBoatPoll
2. Você verá um botão amarelo "Compare & pull request"
3. Clique nele
   ...existing code...

### 6️⃣ Aguarde Revisão Automática

GitHub Actions rodará automaticamente:

- ✅ Testes unitários
- ✅ ESLint (padrão de código)
- ✅ Prettier (formatação)
- ✅ Cobertura (70% mínimo)

Se algum checker falhar:

1. Veja logs no GitHub (seção "Checks" da PR)
2. Corrija o problema localmente
3. Commit + push (automático na PR)

**Exemplo:**

```
Falha em ESLint: Extra semicolon

# Solução:
npm run format                # Auto-fix
git add .
git commit -m "[fix] Prettier: remover ponto-e-vírgula extra"
git push
```

### 7️⃣ Code Review Manual

Alguém da equipe revisará seu código:

- Poderá solicitar mudanças (CI/CD ainda passa, mas quer melhorias)
- Se aprovado: ✅ "Approved"

Se pedir mudanças:

```bash
# Corrija conforme solicitado
npm test                      # Certifique-se que passa
git add .
git commit -m "[review] Endereço dos comentários da review"
git push                      # Automático na PR, não precisa de novo push -u
```

### 8️⃣ Merge para Develop

Quando tudo estiver ✅:

1. Clique em "Squash and Merge" (recomendado para histórico limpo)
   ou "Create a merge commit" (preserva todos os commits)
2. Confirme
3. Clique em "Delete branch" para limpar

Pronto! Sua feature foi mergeada para `develop`.

### 9️⃣ Sincronize Local

Volte para `develop` localmente:

```bash
git checkout develop
git pull origin develop       # Puxe a última versão (sua PR está aqui!)
git branch -D feature/meu-feature-descritivo  # Apague branch local
```

## Cenários Comuns

### 🔀 Conflito de Merge?

Se alguém mergeou outro PR antes do seu:

```bash
# GitHub vai mostrar: "This branch has conflicts that must be resolved"

# Opção 1: Resolver no GitHub (UI)
# - Clique em "Resolve conflicts"
# - Edite o arquivo conflitante manualmente
# - Clique "Mark as resolved"
# - Commit

# Opção 2: Resolver localmente
git fetch origin
git rebase origin/develop
# Resolve conflicts nos arquivos
git add .
git rebase --continue
git push --force-with-lease origin feature/seu-feature
```

### 📴 Precisa Atualizar Sua Branch com Mudanças em develop?

```bash
git fetch origin
git rebase origin/develop
# Resolve qualquer conflito se houver
git push --force-with-lease
```

### 🔙 Precisa Desfazer um Commit?

```bash
# Último commit (não foi push ainda)
git reset --soft HEAD~1       # Mantém arquivos editados
git reset --hard HEAD~1       # Descarta mudanças

# Commit já foi push
git revert HEAD               # Cria novo commit que desfaz o anterior
git push
```

### 🧹 Limpar Branches Locais não Utilizadas

```bash
git branch -D feature/old-feature    # Força delete
git fetch --prune                    # Remove branches deletadas no remote
```

## Regras Importantes

1. ✅ **Sempre trabalhe em `develop`** - nunca em `main` diretamente
2. ✅ **Crie PRs do seu feature branch** - não commits diretos
3. ✅ **Testes devem passar** - `npm test` 70%+ cobertura
4. ✅ **Linter deve passar** - `npm run lint`
5. ✅ **Um problema por PR** - não misture features
6. ✅ **Commits descritivos** - `[feat] algo` melhor que `fix stuff`
7. ✅ **Rebase se confortável** - evita commit merge desnecessários

## Troubleshooting

### "fatal: origin does not appear to be a git repository"

Não está no diretório do projeto:

```bash
cd /caminho/para/LittleBoatPoll
```

### "error: Your local changes to the following files would be overwritten"

Mudanças não foram commitadas:

```bash
git status                    # Veja o que mudou
git add .
git commit -m "[wip] Work in progress"
```

### "On branch develop...nothing to commit"

Você está na branch certa e tudo foi commitado. Próximo passo: `git push`.

### PR mostra "1 commit ahead of develop"

Normal! Significa sua branch tem mudanças que `develop` ainda não tem.

---

**Próximos passos:** [ARCHITECTURE.md](ARCHITECTURE.md) para entender a estrutura do projeto.
