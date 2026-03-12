# Internal Permissions Migration

## Overview

Administrative permissions were migrated from a Discord-role-dependent model to an internal user-ID model.

## Why This Migration

The internal model removes operational issues caused by Discord role hierarchy and manual role management.

Main benefits:

- no required Discord role setup for poll creators
- explicit and persistent control through bot-managed data
- lower risk of accidental permission loss caused by role deletion

## Breaking Changes

- Legacy `/criadores` command is removed
- Use `/criador-de-enquete` for creator management
- Permission assignments are persisted in `criadores-internos.json`

## Current Permission Resolution

Access is granted when any of the following is true:

1. Discord administrator permission
2. Server owner
3. User ID is registered as internal creator

If none applies, the user keeps non-admin voting capabilities only.

## Operational Commands

### Add creator

```text
/criador-de-enquete adicionar @user
```

### Remove creator

```text
/criador-de-enquete remover @user
```

### List creators

```text
/criador-de-enquete listar
```

## Data Model

`criadores-internos.json` stores creator user IDs:

```json
{
  "criadores": ["123456789012345678", "987654321098765432"]
}
```

## Mensalista Role Binding (v2.0.1+)

The mensalista weighting system can optionally bind to a Discord role named `Mensalistas`.

- role binding is discovered by role name (case-insensitive)
- mapping is persisted in `role-bindings.json`
- fallback remains `mensalistas.json` when role binding is unavailable

## Migration Checklist

For existing servers that used role-based creators:

1. Identify users who previously had creator access
2. Re-register them using `/criador-de-enquete adicionar`
3. Optionally remove obsolete Discord creator roles

## Security Guards

- creator management requires creator/admin-level permission
- server owner and Discord admins retain access
- user input is validated before persistence updates

## Related Files

- `src/utils/permissions.js`
- `src/utils/file-handler.js`
- `src/commands/admin/criador-de-enquete.js`
- `src/commands/admin/criador-toggle-context.js`
