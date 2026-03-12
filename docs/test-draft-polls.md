# Draft Poll Test Guide

This document describes how to manually validate the draft poll workflow implemented by the `/rascunho` command.

## Scope

Use this guide to validate:

- draft creation
- draft editing
- draft inspection
- draft listing
- draft publishing
- draft deletion

## Example 1: Create a Draft

Command:

```text
/rascunho criar
titulo: "Which Machado de Assis book should we read next?"
opcoes: "Memorias Postumas de Bras Cubas, Dom Casmurro, Quincas Borba, Esaú e Jacó"
max_votos: 1
peso_mensalista: Nao
```

Expected result:

- the bot returns a success confirmation
- a draft ID is generated
- the response suggests `/rascunho editar`, `/rascunho exibir`, and `/rascunho publicar`
- the draft is saved into draft persistence

## Example 2: Edit the Draft

Starting from the generated draft ID, validate these edits.

Change only the title:

```text
/rascunho editar
id: A1B2C3D4
titulo: "Vote: Which Machado de Assis title do you prefer?"
```

Expected result:

- only the title changes
- other fields remain unchanged

Change vote limit and mensalista weighting:

```text
/rascunho editar
id: A1B2C3D4
max_votos: 2
peso_mensalista: Sim
```

Expected result:

- `max_votos` becomes `2`
- monthly members now count with weight `2`

Replace the options list:

```text
/rascunho editar
id: A1B2C3D4
opcoes: "Memorias Postumas de Bras Cubas, Dom Casmurro, Quincas Borba, Esaú e Jacó, Memorial de Aires"
```

Expected result:

- the draft now contains the new option set
- validation still respects the Discord option limits

## Example 3: Show Draft Details

Command:

```text
/rascunho exibir
id: A1B2C3D4
```

Expected result:

- title is shown correctly
- options are listed in order
- draft ID is visible
- creator is identified
- max vote value is correct
- mensalista weighting is shown correctly
- created and updated timestamps are present
- status indicates a non-published draft

## Example 4: List Drafts

Command:

```text
/rascunho listar
```

Expected result:

- the created draft appears in the list
- each entry includes ID, title, option count, creator, and creation timestamp
- published or deleted drafts no longer appear

## Example 5: Publish the Draft

Command:

```text
/rascunho publicar
id: A1B2C3D4
canal: #votacoes
```

Expected result:

1. the bot sends the poll to the target channel
2. reaction options are added automatically
3. the poll starts accepting votes
4. the draft is removed from draft persistence
5. the active poll is stored in active poll persistence

Validate the published poll message:

- poll title is correct
- vote limit text matches the draft configuration
- mensalista weighting rule is correct
- the poll message contains its message ID

## Example 6: Delete the Draft

Command:

```text
/rascunho deletar
id: A1B2C3D4
```

Expected result:

- the bot confirms deletion
- the title and ID are shown in the confirmation
- the draft no longer appears in `/rascunho listar`

## Full Validation Flow

Recommended end-to-end sequence:

1. create a draft with `/rascunho criar`
2. confirm it appears in `/rascunho listar`
3. inspect it with `/rascunho exibir`
4. edit it with `/rascunho editar`
5. confirm the updated values with `/rascunho exibir`
6. publish it with `/rascunho publicar`
7. confirm it disappears from `/rascunho listar`
8. confirm the live poll appears in the target channel

## Error Cases to Validate

- unknown draft ID
- fewer than 2 options
- `max_votos` larger than the option count
- missing creator permissions
- more than 20 options

## Limits and Expectations

- options per poll: 2 to 20
- max votes: must respect the configured validation rules
- title length: Discord slash command and embed constraints apply
- publishing is slower than in-memory edits because it sends a message and adds reactions

## Persistence Check

After creating or editing a draft, confirm that the saved object includes:

- `id`
- `titulo`
- `opcoes`
- `maxVotos`
- `usarPesoMensalista`
- `criadorId`
- `criadoEm`
- `editadoEm`
- `status`
