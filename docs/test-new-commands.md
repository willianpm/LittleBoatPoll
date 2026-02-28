# Exemplos de Teste - Novos Comandos v1.2

Adicionar e remover opções individualmente.

## Índice

- [Teste 1: Adicionar Opções Individuais](#teste-1-adicionar-opções-individuais)
- [Teste 2: Remover Opção por Texto](#teste-2-remover-opção-por-texto)
- [Teste 3: Remover Opção por Número](#teste-3-remover-opção-por-número)
- [Teste 4: Adicionar e Remover Múltiplas Vezes](#teste-4-adicionar-e-remover-múltiplas-vezes)
- [Teste 5: Validação de Duplicatas](#teste-5-validação-de-duplicatas)
- [Teste 6: Validação de Limite (20 Opções)](#teste-6-validação-de-limite-20-opções)
- [Teste 7: Validação de Mínimo (2 Opções)](#teste-7-validação-de-mínimo-2-opções)
- [Teste 8: Opção Não Encontrada](#teste-8-opção-não-encontrada)
- [Teste 9: Case-Insensitive](#teste-9-case-insensitive)
- [Teste 10: Ajuste Automático de Max Votos](#teste-10-ajuste-automático-de-max-votos)
- [Teste 11: Fluxo Completo (Criar → Adicionar → Remover → Publicar)](#teste-11-fluxo-completo-criar--adicionar--remover--publicar)
- [Teste 12: Combinação com Outros Comandos de Edição](#teste-12-combinação-com-outros-comandos-de-edição)
- [Resumo de Funcionalidades Testadas](#resumo-de-funcionalidades-testadas)
- [Possíveis Erros e Soluções](#possíveis-erros-e-soluções)

## Teste 1: Adicionar Opções Individuais

**Passos:**

1. Criar rascunho inicial:
   /rascunho criar
   titulo: "Votação de Livros"
   opcoes: "Livro A, Livro B, Livro C"
   max_votos: 2
   peso_mensalista: Não

   [Bot retorna ID: ABC12345]

2. Visualizar opções atuais:
   /rascunho exibir
   id: ABC12345

   **Resultado:**
   Opções:
   1. Livro A
   2. Livro B
   3. Livro C

3. Adicionar novas opções:
   /rascunho adicionar-opcao
   id: ABC12345
   opcoes: Livro D, Livro E

   **Resultado:**
   ✅ Opções Adicionadas!
   Opções Adicionadas: Livro D, Livro E
   Total de Opções: 5
   Todas as Opções: Livro A, Livro B, Livro C, Livro D, Livro E

4. Confirmar:
   /rascunho exibir
   id: ABC12345

   **Resultado:**
   Opções:
   1. Livro A
   2. Livro B
   3. Livro C
   4. Livro D
   5. Livro E

## Teste 2: Remover Opção por Texto

**Continuando do Teste 1:**

5. Remover opção específica:
   /rascunho remover-opcao
   id: ABC12345
   opcao: Livro B

   **Resultado:**
   ✅ Opção Removida!
   Opção Removida: Livro B
   Total de Opções: 4
   Opções Restantes: Livro A, Livro C, Livro D, Livro E

6. Confirmar:
   /rascunho exibir
   id: ABC12345

   **Resultado:**
   Opções:
   1. Livro A
   2. Livro C
   3. Livro D
   4. Livro E

## Teste 3: Remover Opção por Número

**Continuando:**

7. Remover a 3ª opção (Livro D):
   /rascunho remover-opcao
   id: ABC12345
   opcao: 3

   **Resultado:**
   ✅ Opção Removida!
   Opção Removida: Livro D
   Total de Opções: 3
   Opções Restantes: Livro A, Livro C, Livro E

8. Confirmar:
   /rascunho exibir
   id: ABC12345

   **Resultado:**
   Opções:
   1. Livro A
   2. Livro C
   3. Livro E

## Teste 4: Adicionar e Remover Múltiplas Vezes

9. Adicionar mais opções:
   /rascunho adicionar-opcao
   id: ABC12345
   opcoes: Livro F, Livro G, Livro H

   **Resultado:** Total de 6 opções

10. Remover uma:
    /rascunho remover-opcao
    id: ABC12345
    opcao: Livro C

    **Resultado:** Total de 5 opções

11. Adicionar mais uma:
    /rascunho adicionar-opcao
    id: ABC12345
    opcoes: Livro I

    **Resultado:** Total de 6 opções

12. Visualizar final:
    /rascunho exibir
    id: ABC12345

    **Resultado:**
    Opções:
    1. Livro A
    2. Livro E
    3. Livro F
    4. Livro G
    5. Livro H
    6. Livro I

## Teste 5: Validação de Duplicatas

13. Tentar adicionar opção duplicada:
    /rascunho adicionar-opcao
    id: ABC12345
    opcoes: Livro A

    **Resultado:**
    ❌ Erro! As seguintes opções já existem no rascunho: Livro A

14. Tentar adicionar múltiplas, algumas duplicadas:
    /rascunho adicionar-opcao
    id: ABC12345
    opcoes: Livro J, Livro A, Livro K

    **Resultado:**
    ❌ Erro! As seguintes opções já existem no rascunho: Livro A

## Teste 6: Validação de Limite (20 Opções)

15. Criar rascunho com 18 opções:
    /rascunho criar
    titulo: "Teste Limite"
    opcoes: "Op1, Op2, Op3, Op4, Op5, Op6, Op7, Op8, Op9, Op10, Op11, Op12, Op13, Op14, Op15, Op16, Op17, Op18"
    max_votos: 5

    [ID: XYZ789]

16. Adicionar 2 opções (OK - total 20):
    /rascunho adicionar-opcao
    id: XYZ789
    opcoes: Op19, Op20

    **Resultado:** ✅ Sucesso! Total: 20 opções

17. Tentar adicionar mais 1 (falha):
    /rascunho adicionar-opcao
    id: XYZ789
    opcoes: Op21

    **Resultado:**
    ❌ Erro! O Discord limita a 20 reações por mensagem.
    Total de opções: 21. Remova 1 opção(ões).

## Teste 7: Validação de Mínimo (2 Opções)

18. Criar rascunho com 3 opções:
    /rascunho criar
    titulo: "Teste Mínimo"
    opcoes: "A, B, C"
    max_votos: 1

    [ID: MIN123]

19. Remover uma opção:
    /rascunho remover-opcao
    id: MIN123
    opcao: B

    **Resultado:** ✅ Sucesso! Restam: A, C

20. Tentar remover mais uma (falha):
    /rascunho remover-opcao
    id: MIN123
    opcao: A

    **Resultado:**
    ❌ Erro! A enquete precisa ter pelo menos 2 opções.
    Não é possível remover mais opções.

## Teste 8: Opção Não Encontrada

21. Tentar remover opção inexistente:
    /rascunho remover-opcao
    id: ABC12345
    opcao: Livro Z

    **Resultado:**
    ❌ Erro! Opção "Livro Z" não encontrada.

    Opções disponíveis:
    1. Livro A
    2. Livro E
    3. Livro F
    4. Livro G
    5. Livro H
    6. Livro I

22. Tentar remover por número inválido:
    /rascunho remover-opcao
    id: ABC12345
    opcao: 99

    **Resultado:** (mesmo erro acima)

## Teste 9: Case-Insensitive

23. Adicionar opção com maiúsculas:
    /rascunho adicionar-opcao
    id: ABC12345
    opcoes: LIVRO J

    **Resultado:** ✅ Sucesso!

24. Tentar adicionar mesmo texto em minúsculas:
    /rascunho adicionar-opcao
    id: ABC12345
    opcoes: livro j

    **Resultado:**
    ❌ Erro! As seguintes opções já existem no rascunho: livro j

25. Remover usando case diferente:
    /rascunho remover-opcao
    id: ABC12345
    opcao: LiVrO j

    **Resultado:** ✅ Sucesso! (remove "LIVRO J")

## Teste 10: Ajuste Automático de Max Votos

26. Criar rascunho com 5 opções e max_votos=3:
    /rascunho criar
    titulo: "Teste Max Votos"
    opcoes: "A, B, C, D, E"
    max_votos: 3

    [ID: MAX456]

27. Remover 2 opções (ficam 3):
    /rascunho remover-opcao
    id: MAX456
    opcao: D

    /rascunho remover-opcao
    id: MAX456
    opcao: E

    **Resultado:**
    Total: 3 opções (A, B, C)
    max_votos: 3 (continua igual)

28. Remover mais 1 (ficam 2):
    /rascunho remover-opcao
    id: MAX456
    opcao: C

    **Resultado:**
    Total: 2 opções (A, B)
    max_votos: 2 (ajustado automaticamente de 3 para 2)

29. Adicionar 3 opções:
    /rascunho adicionar-opcao
    id: MAX456
    opcoes: C, D, E

    **Resultado:**
    Total: 5 opções (A, B, C, D, E)
    max_votos: 2 (NÃO muda - mantém o valor atual)

30. Visualizar para confirmar:
    /rascunho exibir
    id: MAX456

    **Resultado:**
    Opções: A, B, C, D, E (5 opções)
    Máximo de Votos: 2

## Teste 11: Fluxo Completo (Criar → Adicionar → Remover → Publicar)

31. Criar rascunho inicial:
    /rascunho criar
    titulo: "Escolha Final de Livros"
    opcoes: "1984, Brave New World"
    max_votos: 1
    peso_mensalista: Sim

    [ID: FINAL99]

32. Adicionar mais opções progressivamente:
    /rascunho adicionar-opcao
    id: FINAL99
    opcoes: Fahrenheit 451, Animal Farm

    Total: 4 opções

33. Adicionar mais:
    /rascunho adicionar-opcao
    id: FINAL99
    opcoes: The Handmaid's Tale, We

    Total: 6 opções

34. Decidir remover algumas:
    /rascunho remover-opcao
    id: FINAL99
    opcao: We

    Total: 5 opções

35. Adicionar substituta:
    /rascunho adicionar-opcao
    id: FINAL99
    opcoes: Lord of the Flies

    Total: 6 opções

36. Visualizar antes de publicar:
    /rascunho exibir
    id: FINAL99

    **Resultado:**
    Título: Escolha Final de Livros
    Opções:
    1. 1984
    2. Brave New World
    3. Fahrenheit 451
    4. Animal Farm
    5. The Handmaid's Tale
    6. Lord of the Flies
       Máximo de Votos: 1
       Peso Mensalista: Sim (2x)

37. Publicar:
    /rascunho publicar
    id: FINAL99
    canal: #votacoes

    **Resultado:** ✅ Enquete publicada e ativa!

## Teste 12: Combinação com Outros Comandos de Edição

38. Criar rascunho:
    /rascunho criar
    titulo: "Teste Combo"
    opcoes: "X, Y, Z"
    max_votos: 1

    [ID: COMBO00]

39. Adicionar opções:
    /rascunho adicionar-opcao
    id: COMBO00
    opcoes: W, V

    Total: 5 opções

40. Editar título:
    /rascunho editar
    id: COMBO00
    titulo: "Teste Combinado Final"

    ✅ Título atualizado

41. Remover opção:
    /rascunho remover-opcao
    id: COMBO00
    opcao: Y

    Total: 4 opções

42. Editar max_votos:
    /rascunho editar
    id: COMBO00
    max_votos: 2

    ✅ Max votos atualizado

43. Adicionar mais:
    /rascunho adicionar-opcao
    id: COMBO00
    opcoes: U

    Total: 5 opções

44. Visualizar resultado final:
    /rascunho exibir
    id: COMBO00

    **Resultado:**
    Título: Teste Combinado Final
    Opções: X, Z, W, V, U
    Máximo de Votos: 2

## Resumo de Funcionalidades Testadas

✅ Adicionar opções individuais
✅ Adicionar múltiplas opções de uma vez
✅ Remover opção por texto exato
✅ Remover opção por número (1-based)
✅ Validação de duplicatas (case-insensitive)
✅ Validação de limite máximo (20 opções)
✅ Validação de mínimo (2 opções)
✅ Mensagem de erro quando opção não encontrada
✅ Ajuste automático de max_votos
✅ Case-insensitive ao comparar opções
✅ Combinação com outros comandos de edição
✅ Fluxo completo: criar → adicionar → remover → publicar

## Possíveis Erros e Soluções

**Erro:** "As seguintes opções já existem"
→ Solução: Verifique se não está tentando adicionar opção duplicada
→ Lembre que é case-insensitive ("Livro A" = "livro a")

**Erro:** "Opção não encontrada"
→ Solução: Use /rascunho exibir para ver lista de opções
→ Copie o texto exato ou use o número da opção

**Erro:** "Limite de 20 reações"
→ Solução: Remova opções antes de adicionar novas
→ Use /rascunho remover-opcao

**Erro:** "Precisa ter pelo menos 2 opções"
→ Solução: Não é possível remover mais opções
→ Adicione novas opções antes de remover

**Erro:** "Permissão negada"
→ Solução: Você precisa ter o cargo Criador
→ Verifique com /rascunho listar quem criou
