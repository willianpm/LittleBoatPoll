# New Draft Command Test Guide

This document focuses on the option-management commands added to the `/rascunho` workflow.

## Scope

Use this guide to validate:

- `/rascunho adicionar-opcao`
- `/rascunho remover-opcao`
- duplicate handling
- option count limits
- minimum option count enforcement
- automatic `max_votos` adjustments when options are removed

## Test 1: Add Options Individually

1. Create a draft:

```text
/rascunho criar
titulo: "Book Selection Vote"
opcoes: "Book A, Book B, Book C"
max_votos: 2
peso_mensalista: No
```

2. Confirm the starting options with `/rascunho exibir`.

3. Add new options:

```text
/rascunho adicionar-opcao
id: ABC12345
opcoes: Book D, Book E
```

Expected result:

- the new options are appended
- the total option count increases correctly
- `/rascunho exibir` shows the updated order

## Test 2: Remove an Option by Text

Command:

```text
/rascunho remover-opcao
id: ABC12345
opcao: Book B
```

Expected result:

- the specific option is removed
- the remaining options keep their order
- the response identifies the removed option

## Test 3: Remove an Option by Number

Command:

```text
/rascunho remover-opcao
id: ABC12345
opcao: 3
```

Expected result:

- the third option is removed
- `/rascunho exibir` reflects the new numbering

## Test 4: Repeated Add and Remove Operations

Validate that the command sequence remains stable after several edits:

1. add multiple options
2. remove one option
3. add another option
4. inspect the final order with `/rascunho exibir`

Expected result:

- no duplicate corruption
- no unexpected reordering
- no stale values in the confirmation messages

## Test 5: Duplicate Validation

Attempt to add an option that already exists:

```text
/rascunho adicionar-opcao
id: ABC12345
opcoes: Book A
```

Expected result:

- the command rejects the addition
- the error identifies the duplicated option

Also validate a mixed input where only some options are duplicates.

## Test 6: Maximum Option Limit

Create a draft with 18 options, add 2 more, and then try to add one extra option.

Expected result:

- reaching 20 options succeeds
- exceeding 20 options fails with a Discord reaction limit message

## Test 7: Minimum Option Count

Create a draft with 3 options and remove one.

Expected result:

- the draft with 2 options remains valid

Try to remove one more.

Expected result:

- the command is rejected because a poll must keep at least 2 options

## Test 8: Unknown Option Handling

Try to remove:

- an option text that does not exist
- an invalid numeric index

Expected result:

- the command fails
- the response explains that the option was not found
- available options are listed or implied clearly enough for correction

## Test 9: Case-Insensitive Matching

Validate that duplicate detection and removal behave correctly when the text casing changes.

Expected result:

- duplicate checks are case-insensitive
- removal by text also works when letter casing differs

## Test 10: Automatic `max_votos` Adjustment

Create a draft with 5 options and `max_votos=3`, then remove options until only 2 remain.

Expected result:

- `max_votos` is reduced automatically when the remaining option count would otherwise make it invalid
- adding options later does not automatically raise `max_votos` again

## Test 11: Full Edit Flow

Recommended sequence:

1. create draft
2. add options progressively
3. remove one or more options
4. inspect with `/rascunho exibir`
5. publish with `/rascunho publicar`

Expected result:

- the final poll contains exactly the options present in the last draft state
- the configured vote limit is preserved correctly
- mensalista weighting matches the selected draft configuration

## Test 12: Combined Editing

Use these commands together on the same draft:

- `/rascunho editar`
- `/rascunho adicionar-opcao`
- `/rascunho remover-opcao`
- `/rascunho exibir`

Expected result:

- all commands operate on the same persisted draft state
- no command silently resets fields changed by another command

## Summary of Behaviors to Confirm

- options can be added without replacing the full list
- options can be removed by text or by index
- duplicates are rejected
- option limits are enforced
- minimum option count is enforced
- `max_votos` stays valid after removals
- the final published poll matches the edited draft
