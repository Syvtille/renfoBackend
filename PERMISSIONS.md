# Systeme de permissions bitmask

## Principe (slides cours)

**1 permission = 1 bit dans un entier BigInt.**
Le mask d'un utilisateur est un nombre dont les bits actifs representent ses droits.

```
Bit :   8    7    6    5    4    3    2    1    0
Perm :  ADM  MGT  MGU  SPE  DES  REF  PLY  REA  MSG
Valeur: 256  128  64   32   16   8    4    2    1
```

---

## Definition des permissions

```typescript
// src/shared/permissions/permission.constants.ts

export const SEND_MESSAGE      = 1n << 0n;  // 1   joueur    : envoyer un message
export const SEND_REACTION     = 1n << 1n;  // 2   arbitre   : envoyer une réaction
export const JOIN_AS_PLAYER    = 1n << 2n;  // 4   joueur    : rejoindre un lobby
export const JOIN_AS_REFEREE   = 1n << 3n;  // 8   arbitre   : rejoindre un lobby
export const DESIGNATE_WINNER  = 1n << 4n;  // 16  arbitre   : désigner le gagnant
export const SPECTATE_LOBBY    = 1n << 5n;  // 32  staff     : spectateur invisible
export const MANAGE_USERS      = 1n << 6n;  // 64  support   : activer/désactiver comptes
export const MANAGE_TOPICS     = 1n << 7n;  // 128 content   : rédiger les sujets
export const ADMIN_ALL         = 1n << 8n;  // 256 admin     : accès total
```

---

## Roles predéfinis (combinaisons via `|`)

| Role | Permissions | Mask | Binaire |
|------|-------------|------|---------|
| PLAYER | SEND_MESSAGE \| JOIN_AS_PLAYER | 5 | `000000101` |
| REFEREE | SEND_REACTION \| JOIN_AS_REFEREE \| DESIGNATE_WINNER | 26 | `000011010` |
| SUPPORT | SPECTATE_LOBBY \| MANAGE_USERS | 96 | `001100000` |
| CONTENT_MANAGER | SPECTATE_LOBBY \| MANAGE_TOPICS | 160 | `010100000` |
| ADMIN | tous les bits 0–8 | 511 | `111111111` |

```typescript
export const ROLE_PLAYER          = SEND_MESSAGE | JOIN_AS_PLAYER;           // 5
export const ROLE_REFEREE         = SEND_REACTION | JOIN_AS_REFEREE | DESIGNATE_WINNER; // 26
export const ROLE_SUPPORT         = SPECTATE_LOBBY | MANAGE_USERS;           // 96
export const ROLE_CONTENT_MANAGER = SPECTATE_LOBBY | MANAGE_TOPICS;          // 160
export const ROLE_ADMIN           = (1n << 9n) - 1n;                         // 511
```

---

## Operations bitwise (permission.utils.ts)

Trois fonctions, nommees comme sur les slides :

```typescript
// AJOUTER  → mask = mask | PERM
const add    = (m: bigint, p: bigint): bigint  => m | p;

// RETIRER  → mask = mask & ~PERM
const remove = (m: bigint, p: bigint): bigint  => m & ~p;

// TESTER   → (mask & PERM) !== 0n
const has    = (m: bigint, p: bigint): boolean => (m & p) !== 0n;
```

### Exemples

```typescript
let mask = 0n;
mask = add(mask, SEND_MESSAGE);    // mask = 1
mask = add(mask, JOIN_AS_PLAYER);  // mask = 5  (0b101)

has(mask, SEND_MESSAGE);           // true  → (5 & 1) !== 0
has(mask, SEND_REACTION);          // false → (5 & 2) === 0

// Tester plusieurs permissions d'un coup (au moins une) :
has(mask, SEND_MESSAGE | SEND_REACTION);  // true → (5 & 3) !== 0

mask = remove(mask, SEND_MESSAGE); // mask = 4  (0b100)
has(mask, SEND_MESSAGE);           // false
```

---

## Guard NestJS (HTTP)

### Declaration

```typescript
@Controller('matchmaking')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class MatchmakingController {

  @Post('join/player')
  @RequirePermissions(JOIN_AS_PLAYER)         // seul un joueur peut accéder
  joinPlayer(@Request() req) { ... }

  @Post('join/referee')
  @RequirePermissions(JOIN_AS_REFEREE)        // seul un arbitre
  joinReferee(@Request() req) { ... }

  @Post('winner')
  @RequirePermissions(DESIGNATE_WINNER)       // seul l'arbitre du lobby
  setWinner(...) { ... }

  @Post('topics')
  @RequirePermissions(MANAGE_TOPICS)          // seul un content manager
  addTopic(...) { ... }
}
```

### Fonctionnement interne du PermissionsGuard

```typescript
const required: bigint = reflector.get(PERMISSIONS_KEY, handler);
const userMask: bigint = BigInt(req.user.permissions); // string → bigint

if (!has(userMask, required)) throw new ForbiddenException();
```

---

## Verification cote WebSocket (ChatGateway)

Les events WebSocket verifient les permissions directement via `has()` :

```typescript
// A la connexion :
client.data.permissions = BigInt(payload.permissions);

// Dans le handler sendMessage :
if (!has(client.data.permissions, SEND_MESSAGE)) {
  client.emit('error', { message: 'Permission refusée' });
  return;
}

// Dans le handler spectate (spectateur invisible) :
if (!has(client.data.permissions, SPECTATE_LOBBY)) {
  client.emit('error', { message: 'Permission refusée : SPECTATE_LOBBY' });
  return;
}
client.join(lobbyId); // rejoint la room sans notifier les autres
```

---

## Stockage

| Endroit | Type | Valeur exemple |
|---------|------|----------------|
| Base de données (SQLite) | `varchar` | `"5"` |
| JWT payload | `string` | `"5"` |
| Memoire (domain model) | `bigint` | `5n` |
| Guard / Gateway | `bigint` | `5n` |

Conversion : `BigInt("5")` → `5n` / `5n.toString()` → `"5"`.

---

## Endpoints et droits

| Endpoint | Methode | Permission | Player | Referee | Support | Content | Admin |
|----------|---------|------------|--------|---------|---------|---------|-------|
| `/auth/register` | POST | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/auth/login` | POST | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/auth/users/:id/stats` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/auth/users` | GET | MANAGE_USERS | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/auth/users/:id/toggle-active` | PATCH | MANAGE_USERS | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/matchmaking/join/player` | POST | JOIN_AS_PLAYER | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/matchmaking/join/referee` | POST | JOIN_AS_REFEREE | ❌ | ✅ | ❌ | ❌ | ✅ |
| `/matchmaking/winner` | POST | DESIGNATE_WINNER | ❌ | ✅ | ❌ | ❌ | ✅ |
| `/matchmaking/topics` | POST | MANAGE_TOPICS | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/matchmaking/topics` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ |
| WS `sendMessage` | — | SEND_MESSAGE | ✅ | ❌ | ❌ | ❌ | ✅ |
| WS `sendReaction` | — | SEND_REACTION | ❌ | ✅ | ❌ | ❌ | ✅ |
| WS `spectate` | — | SPECTATE_LOBBY | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## Ajouter une permission

1. Ajouter la constante (bit suivant disponible) :
```typescript
export const NEW_PERM = 1n << 9n; // 512
```
2. L'inclure dans les roles concernes :
```typescript
export const ROLE_ADMIN = (1n << 10n) - 1n; // etendre le masque admin
```
3. Proteger la route :
```typescript
@RequirePermissions(NEW_PERM)
```

---

## Architecture

```
src/shared/permissions/
├── permission.constants.ts       ← bits + roles (1 bit = 1 permission)
├── permission.utils.ts           ← add / remove / has
├── permissions.guard.ts          ← Guard NestJS (check HTTP)
├── require-permissions.decorator.ts  ← @RequirePermissions(mask)
├── permission.utils.spec.ts      ← tests unitaires
└── index.ts
```
