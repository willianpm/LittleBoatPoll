/**
 * EXEMPLOS DE TESTE - NOVOS COMANDOS v1.2
 *
 * Adicionar e Remover Opções Individualmente
 */

// =====================================
// TESTE 1: Adicionar Opções Individuais
// =====================================

/*
PASSOS:

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
   
   RESULTADO: 
   Opções:
   1. Livro A
   2. Livro B
   3. Livro C

3. Adicionar novas opções:
   /rascunho adicionar-opcao
     id: ABC12345
     opcoes: Livro D, Livro E
   
   RESULTADO:
   ✅ Opções Adicionadas!
   Opções Adicionadas: Livro D, Livro E
   Total de Opções: 5
   Todas as Opções: Livro A, Livro B, Livro C, Livro D, Livro E

4. Confirmar:
   /rascunho exibir
     id: ABC12345
   
   RESULTADO:
   Opções:
   1. Livro A
   2. Livro B
   3. Livro C
   4. Livro D
   5. Livro E
*/

// =====================================
// TESTE 2: Remover Opção por Texto
// =====================================

/*
CONTINUANDO DO TESTE 1:

5. Remover opção específica:
   /rascunho remover-opcao
     id: ABC12345
     opcao: Livro B
   
   RESULTADO:
   ✅ Opção Removida!
   Opção Removida: Livro B
   Total de Opções: 4
   Opções Restantes: Livro A, Livro C, Livro D, Livro E

6. Confirmar:
   /rascunho exibir
     id: ABC12345
   
   RESULTADO:
   Opções:
   1. Livro A
   2. Livro C
   3. Livro D
   4. Livro E
*/

// =====================================
// TESTE 3: Remover Opção por Número
// =====================================

/*
CONTINUANDO:

7. Remover a 3ª opção (Livro D):
   /rascunho remover-opcao
     id: ABC12345
     opcao: 3
   
   RESULTADO:
   ✅ Opção Removida!
   Opção Removida: Livro D
   Total de Opções: 3
   Opções Restantes: Livro A, Livro C, Livro E

8. Confirmar:
   /rascunho exibir
     id: ABC12345
   
   RESULTADO:
   Opções:
   1. Livro A
   2. Livro C
   3. Livro E
*/

// =====================================
// TESTE 4: Adicionar e Remover Múltiplas Vezes
// =====================================

/*
9. Adicionar mais opções:
   /rascunho adicionar-opcao
     id: ABC12345
     opcoes: Livro F, Livro G, Livro H
   
   RESULTADO: Total de 6 opções

10. Remover uma:
    /rascunho remover-opcao
      id: ABC12345
      opcao: Livro C
    
    RESULTADO: Total de 5 opções

11. Adicionar mais uma:
    /rascunho adicionar-opcao
      id: ABC12345
      opcoes: Livro I
    
    RESULTADO: Total de 6 opções

12. Visualizar final:
    /rascunho exibir
      id: ABC12345
    
    RESULTADO:
    Opções:
    1. Livro A
    2. Livro E
    3. Livro F
    4. Livro G
    5. Livro H
    6. Livro I
*/

// =====================================
// TESTE 5: Validação de Duplicatas
// =====================================

/*
13. Tentar adicionar opção duplicada:
    /rascunho adicionar-opcao
      id: ABC12345
      opcoes: Livro A
    
    RESULTADO:
    ❌ Erro! As seguintes opções já existem no rascunho: Livro A

14. Tentar adicionar múltiplas, algumas duplicadas:
    /rascunho adicionar-opcao
      id: ABC12345
      opcoes: Livro J, Livro A, Livro K
    
    RESULTADO:
    ❌ Erro! As seguintes opções já existem no rascunho: Livro A
*/

// =====================================
// TESTE 6: Validação de Limite (20 opções)
// =====================================

/*
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
    
    RESULTADO: ✅ Sucesso! Total: 20 opções

17. Tentar adicionar mais 1 (falha):
    /rascunho adicionar-opcao
      id: XYZ789
      opcoes: Op21
    
    RESULTADO:
    ❌ Erro! O Discord limita a 20 reações por mensagem.
    Total de opções: 21. Remova 1 opção(ões).
*/

// =====================================
// TESTE 7: Validação de Mínimo (2 opções)
// =====================================

/*
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
    
    RESULTADO: ✅ Sucesso! Restam: A, C

20. Tentar remover mais uma (falha):
    /rascunho remover-opcao
      id: MIN123
      opcao: A
    
    RESULTADO:
    ❌ Erro! A enquete precisa ter pelo menos 2 opções.
    Não é possível remover mais opções.
*/

// =====================================
// TESTE 8: Opção Não Encontrada
// =====================================

/*
21. Tentar remover opção inexistente:
    /rascunho remover-opcao
      id: ABC12345
      opcao: Livro Z
    
    RESULTADO:
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
    
    RESULTADO: (mesmo erro acima)
*/

// =====================================
// TESTE 9: Case-Insensitive
// =====================================

/*
23. Adicionar opção com maiúsculas:
    /rascunho adicionar-opcao
      id: ABC12345
      opcoes: LIVRO J
    
    RESULTADO: ✅ Sucesso!

24. Tentar adicionar mesmo texto em minúsculas:
    /rascunho adicionar-opcao
      id: ABC12345
      opcoes: livro j
    
    RESULTADO:
    ❌ Erro! As seguintes opções já existem no rascunho: livro j

25. Remover usando case diferente:
    /rascunho remover-opcao
      id: ABC12345
      opcao: LiVrO j
    
    RESULTADO: ✅ Sucesso! (remove "LIVRO J")
*/

// =====================================
// TESTE 10: Ajuste Automático de max_votos
// =====================================

/*
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
    
    RESULTADO: 
    Total: 3 opções (A, B, C)
    max_votos: 3 (continua igual)

28. Remover mais 1 (ficam 2):
    /rascunho remover-opcao
      id: MAX456
      opcao: C
    
    RESULTADO:
    Total: 2 opções (A, B)
    max_votos: 2 (ajustado automaticamente de 3 para 2)

29. Adicionar 3 opções:
    /rascunho adicionar-opcao
      id: MAX456
      opcoes: C, D, E
    
    RESULTADO:
    Total: 5 opções (A, B, C, D, E)
    max_votos: 2 (NÃO muda - mantém o valor atual)

30. Visualizar para confirmar:
    /rascunho exibir
      id: MAX456
    
    RESULTADO:
    Opções: A, B, C, D, E (5 opções)
    Máximo de Votos: 2
*/

// =====================================
// TESTE 11: Fluxo Completo (Criar → Adicionar → Remover → Publicar)
// =====================================

/*
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
    
    RESULTADO:
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
    
    RESULTADO: ✅ Enquete publicada e ativa!
*/

// =====================================
// TESTE 12: Combinação com Outros Comandos de Edição
// =====================================

/*
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
    
    RESULTADO:
    Título: Teste Combinado Final
    Opções: X, Z, W, V, U
    Máximo de Votos: 2
*/

// =====================================
// RESUMO DE FUNCIONALIDADES TESTADAS
// =====================================

/*
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
*/

// =====================================
// POSSÍVEIS ERROS E SOLUÇÕES
// =====================================

/*
ERRO: "As seguintes opções já existem"
→ Solução: Verifique se não está tentando adicionar opção duplicada
→ Lembre que é case-insensitive ("Livro A" = "livro a")

ERRO: "Opção não encontrada"
→ Solução: Use /rascunho exibir para ver lista de opções
→ Copie o texto exato ou use o número da opção

ERRO: "Limite de 20 reações"
→ Solução: Remova opções antes de adicionar novas
→ Use /rascunho remover-opcao

ERRO: "Precisa ter pelo menos 2 opções"
→ Solução: Não é possível remover mais opções
→ Adicione novas opções antes de remover

ERRO: "Permissão negada"
→ Solução: Você precisa ser criador do rascunho ou admin
→ Verifique com /rascunho listar quem criou
*/

console.log('✅ Guia de testes completo');
console.log('📝 Use os exemplos acima para testar os novos comandos');
console.log('📖 Veja NEW_COMMANDS_GUIDE.md para documentação completa');
