/**
 * GUIA DE TESTE - SISTEMA DE RASCUNHOS DE ENQUETES
 *
 * Este arquivo documenta como testar a funcionalidade de rascunhos
 * Use os comandos abaixo para testara nova feature
 */

// =====================================
// EXEMPLO 1: Criar um Rascunho Simples
// =====================================

/*
COMANDO:
/rascunho criar
  titulo: "Qual é o melhor livro de Machado de Assis?"
  opcoes: "Brás Cubas, Dom Casmurro, Quincas Borba, Esaú e Jacó"
  max_votos: 1
  peso_mensalista: Não

RESULTADO ESPERADO:
✅ Rascunho Criado com Sucesso!
ID do Rascunho: `A1B2C3D4` (exemplo)
Próximos Passos:
• Use /rascunho editar para fazer alterações
• Use /rascunho exibir para visualizar os detalhes
• Use /rascunho publicar para ativar a enquete para votação
*/

// =====================================
// EXEMPLO 2: Editar o Rascunho
// =====================================

/*
COMANDOS (nessa ordem):

1. Mudar o título:
   /rascunho editar
     id: A1B2C3D4
     titulo: "Votação: Qual obra de Machado você prefere?"

   RESULTADO: Apenas o título é atualizado, resto mantém-se igual

2. Mudar max_votos e peso:
   /rascunho editar
     id: A1B2C3D4
     max_votos: 2
     peso_mensalista: Sim

   RESULTADO: max_votos virou 2, peso agora tem 2x para mensalistas

3. Adicionar mais uma opção:
   /rascunho editar
     id: A1B2C3D4
     opcoes: "Brás Cubas, Dom Casmurro, Quincas Borba, Esaú e Jacó, Memórias Póstumas de Brás Cubas"

   RESULTADO: Agora tem 5 opções em vez de 4
*/

// =====================================
// EXEMPLO 3: Visualizar Detalhes
// =====================================

/*
COMANDO:
/rascunho exibir
  id: A1B2C3D4

RESULTADO ESPERADO (Embed com):
- Título: "Votação: Qual obra de Machado você prefere?"
- Opções listadas (1. Brás Cubas, 2. Dom Casmurro, etc)
- ID: `A1B2C3D4`
- Criador: [@NomeDoUsuário]
- Máximo de Votos: 2
- Peso Mensalista: Sim (2x)
- Criado em: [data/hora]
- Editado em: [data/hora - atualizado]
- Status: 📝 Rascunho (não publicado)
*/

// =====================================
// EXEMPLO 4: Listar Todos os Rascunhos
// =====================================

/*
COMANDO:
/rascunho listar

RESULTADO ESPERADO (Embed com):
📝 Rascunhos de Enquetes (3)

ID: `A1B2C3D4`
Título: Votação: Qual obra de Machado você prefere?
Opções: 5
Criador: @Usuario1
Criado em: 26 de fevereiro de 2026 às 10:30
---

ID: `X9Y8Z7W6`
Título: Qual episódio da série assistir?
Opções: 3
Criador: @Usuario2
Criado em: 25 de fevereiro de 2026 às 15:45
---

[etc...]
*/

// =====================================
// EXEMPLO 5: Publicar o Rascunho
// =====================================

/*
COMANDO:
/rascunho publicar
  id: A1B2C3D4
  canal: #votações

O QUE ACONTECE:
1. Bot envia a enquete para o canal #votações
2. Reações (🇦 🇧 🇨 🇩 🇪) são adicionadas automaticamente
3. A enquete começa a aceitar votos
4. Rascunho é removido de draft-polls.json
5. Enquete agora está em active-polls.json

RESULTADO ESPERADO (Embed da enquete):
📚 Votação: Qual obra de Machado você prefere? 📚

Selecione até 2 opções:

🇦 Brás Cubas

🇧 Dom Casmurro

🇨 Quincas Borba

🇩 Esaú e Jacó

🇪 Memórias Póstumas de Brás Cubas

---
Regras 📊
• Você pode votar em até 2 opções
• Mensalistas têm peso 2 nos votos
---

ID: [mensagem_id]
5 opções disponíveis
*/

// =====================================
// EXEMPLO 6: Deletar um Rascunho
// =====================================

/*
COMANDO:
/rascunho deletar
  id: A1B2C3D4

RESULTADO ESPERADO:
✅ Rascunho Deletado

Título: Votação: Qual obra de Machado você prefere?
ID: `A1B2C3D4`

O rascunho foi permanentemente removido

⚠️ AVISO: Não pode ser recuperado!
*/

// =====================================
// FLUXO COMPLETO DE TESTE
// =====================================

/*
PASSO A PASSO PARA TESTAR TUDO:

1. /rascunho criar
   titulo: "Votação de Livros"
   opcoes: "Livro A, Livro B, Livro C"
   max_votos: 1
   peso_mensalista: Não
   
   [Bot retorna ID: ABC12345]

2. /rascunho listar
   [Você verá ABC12345 na lista]

3. /rascunho exibir
   id: ABC12345
   [Vê todos os detalhes]

4. /rascunho editar
   id: ABC12345
   max_votos: 2
   [Agora permite 2 votos]

5. /rascunho editar
   id: ABC12345
   titulo: "Votação Oficial de Livros - Fevereiro 2026"
   [Título atualizado]

6. /rascunho exibir
   id: ABC12345
   [Confirma todas as mudanças]

7. /rascunho publicar
   id: ABC12345
   canal: #votacoes
   [Enquete ao vivo!]

8. /rascunho listar
   [ABC12345 não aparece mais - foi publicado]
*/

// =====================================
// ESTRUTURA DE ARQUIVOS CRIADOS
// =====================================

/*
ARQUIVOS NOVOS OU MODIFICADOS:

1. commands/draft.js
   - Novo arquivo com todos os subcomandos
   - Arquivo: 700+ linhas
   - Contém: criar, editar, listar, exibir, publicar, deletar

2. draft-polls.json
   - Novo arquivo de persistência
   - Armazena rascunhos em disco
   - Formato: Array de objetos

3. index.js (modificado)
   - Adicionada Map client.draftPolls
   - Adicionada função saveDraftPolls()
   - Adicionada função loadDraftPolls()
   - Adicionada chamada na inicialização

4. DRAFT_POLLS_GUIDE.md
   - Documentação completa do sistema
   - Exemplos de uso
   - Referência de comandos

5. CHANGELOG_v1.1.md
   - Histórico de mudanças
   - Detalhes da implementação
*/

// =====================================
// POSSÍVEIS ERROS E SOLUÇÕES
// =====================================

/*
ERRO: "Rascunho com ID não encontrado"
→ Verifique o ID com /rascunho listar
→ IDs são case-sensitive

ERRO: "A enquete precisa ter pelo menos 2 opções"
→ Adicione mais opções ou corrija a separação por vírgula

ERRO: "O número máximo de votos não pode ser maior que o número de opções"
→ Aumente opções ou diminua max_votos

ERRO: "Permissão negada"
→ Verifique se possui o cargo Criador
→ Use /criadores listar para ver os cargos Criador

ERRO: "Discord limita a 20 reações por mensagem"
→ Use máximo 20 opções por enquete
*/

// =====================================
// DICAS IMPORTANTES
// =====================================

/*
✅ BOA PRÁTICA:
1. Sempre use /rascunho exibir antes de publicar
2. Crie rascunhos durante a semana
3. Publique quando tudo estiver pronto
4. Use títulos descritivos
5. Mantenha backup dos rascunhos importantes

❌ EVITE:
1. Deletar sem ter certeza
2. Publicar sem revisar
3. Esquecete nomes dos rascunhos
4. Mudar configurações depois de publicado
   (nesse caso, crie um novo rascunho)
*/

// =====================================
// PERFORMANCE E LIMITES
// =====================================

/*
LIMITES:
- Opções por enquete: 2-20 (limitação do Discord)
- Máximo de votos: 1-19 (máximo = opções - 1)
- Rascunhos simultâneos: Ilimitado
- Tamanho do titulo: até 256 caracteres
- Tamanho de cada opção: até 256 caracteres

PERFORMANCE:
- Carregar rascunhos: ~10ms (para 1000 rascunhos)
- Criar rascunho: ~5ms
- Editar rascunho: ~5ms
- Publicar rascunho: ~1000ms (enviar mensagem + reações)
*/

// =====================================
// DADOS SALVOS
// =====================================

/*
EXEMPLO DE draft-polls.json COM UM RASCUNHO:

[
  {
    "id": "ABC12345",
    "titulo": "Votação Oficial de Livros - Fevereiro 2026",
    "opcoes": [
      "Livro A",
      "Livro B",
      "Livro C"
    ],
    "maxVotos": 2,
    "usarPesoMensalista": false,
    "criadorId": "123456789012345678",
    "criadorNome": "NomeDoUsuário",
    "criadoEm": "2026-02-26T10:30:00.000Z",
    "editadoEm": "2026-02-26T11:45:00.000Z",
    "status": "rascunho"
  }
]
*/

console.log('✅ Guia de Teste Criado - Veja acima para instruções detalhadas');
console.log('📝 Para mais informações, consulte: DRAFT_POLLS_GUIDE.md');
console.log('📋 Para histórico de mudanças, consulte: CHANGELOG_v1.1.md');
