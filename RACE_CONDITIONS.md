# Race Conditions — Analyse, Solutions et Implémentation

## Table des matières

1. [RC-1 — TOCTOU dans `RegisterUseCase`](#rc-1--toctou-dans-registerusecase)
2. [RC-2 — Lost Update dans `JoinAsPlayerUseCase`](#rc-2--lost-update-dans-joinasplayerusecase)
3. [RC-3 — TOCTOU dans `JoinAsRefereeUseCase`](#rc-3--toctou-dans-joinasrefereeusecase)
4. [RC-4 — Non-atomicité dans `UpdateStatsUseCase`](#rc-4--non-atomicité-dans-updatestatsusecase)
5. [RC-5 — Race find-or-create dans `SendDirectMessageUseCase`](#rc-5--race-find-or-create-dans-senddirectmessageusecase)
6. [RC-6 — Phantom Read dans `TopicRepository.findRandom()`](#rc-6--phantom-read-dans-topicrepositoryfindRandom)
7. [RC-7 — État partagé mutable dans `MessagingGateway`](#rc-7--état-partagé-mutable-dans-messaginggateaway)
8. [Système de révocation de Refresh Token](#système-de-révocation-de-refresh-token)
9. [Récapitulatif des mécanismes utilisés](#récapitulatif-des-mécanismes-utilisés)

---

## RC-1 — TOCTOU dans `RegisterUseCase`

### Fichier concerné
`src/contexts/auth/app/usecases/register.usecase.ts`

### Description du problème

**Type :** TOCTOU (Time-Of-Check-Time-Of-Use)

```
Thread A                          Thread B
  │                                 │
  ├─ findByEmail("x@x.com") → null  │
  │                                 ├─ findByEmail("x@x.com") → null
  │                                 ├─ findByUsername("alice") → null
  ├─ findByUsername("alice") → null  │
  ├─ bcrypt.hash(...)               │
  │                                 ├─ bcrypt.hash(...)
  ├─ save({ email: "x@x.com", ... }) │
  │                                 ├─ save({ email: "x@x.com", ... }) ← DOUBLON !
```

Deux inscriptions simultanées avec le même email passent toutes les deux la vérification
(`findByEmail` retourne `null` pour les deux), car aucune n'a encore sauvegardé.

### Solution choisie

**Contrainte UNIQUE de la base de données + gestion d'erreur.**

Les colonnes `email` et `username` ont déjà `unique: true` dans l'entité TypeORM.
On intercepte l'erreur PostgreSQL `23505` (unique_violation) au moment du `save()`.
Les vérifications préalables restent (feedback rapide), mais le vrai garde-fou est la DB.

**Pourquoi cette solution ?**
Une contrainte de base de données est atomique par nature. Quelle que soit la concurrence
en amont (Node.js, load balancer, plusieurs instances), la contrainte est toujours respectée.
C'est la seule façon de garantir l'unicité dans un système distribué.

### Code
```typescript
try {
  const user = await this.userRepo.save({ email, username, ... });
  return { ... };
} catch (err) {
  if (err instanceof QueryFailedError && (err as any).code === '23505') {
    const detail = (err as any).detail ?? '';
    if (detail.includes('email')) throw new ConflictException('Email already taken');
    if (detail.includes('username')) throw new ConflictException('Username already taken');
    throw new ConflictException('Account already exists');
  }
  throw err;
}
```

---

## RC-2 — Lost Update dans `JoinAsPlayerUseCase`

### Fichier concerné
`src/contexts/matchmaking/app/usecases/join-as-player.usecase.ts`
`src/contexts/matchmaking/infra/lobby.repository.ts`

### Description du problème

**Type :** Lost Update / TOCTOU

```
Thread A (Joueur A)               Thread B (Joueur B)
  │                                 │
  ├─ findWaitingLobby() → Lobby#1   │
  │                                 ├─ findWaitingLobby() → Lobby#1  (même lobby !)
  ├─ lobby.addPlayerAgainst(A)      │
  │                                 ├─ lobby.addPlayerAgainst(B)
  ├─ save(lobby) → playerAgainst=A  │
  │                                 ├─ save(lobby) → playerAgainst=B  (écrase A !)
```

Les deux joueurs trouvent le même lobby "libre", le rejoignent en mémoire,
et la dernière sauvegarde écrase la première → un joueur est perdu.

### Solution choisie

**Verrou pessimiste (SELECT FOR UPDATE) dans une transaction SERIALIZABLE.**

```sql
BEGIN SERIALIZABLE;
SELECT * FROM lobbies WHERE ... FOR UPDATE;  -- bloque les autres lecteurs
UPDATE lobbies SET playerAgainstId = ? WHERE id = ?;
COMMIT;
```

Le premier thread verrouille le lobby. Le second thread est bloqué sur le `SELECT FOR UPDATE`
jusqu'à la fin de la transaction du premier. Quand il reprend, il voit le lobby complet
(`playerAgainstId IS NOT NULL`) et cherche un autre lobby.

**Pourquoi cette solution ?**
Le verrou pessimiste est adapté quand la contention est probable et coûteuse
(rejoindre le mauvais lobby = état incohérent irréparable). On préfère attendre
plutôt que de retenter.

### Code (dans `LobbyRepository.joinPlayerAtomically`)
```typescript
await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
  const existing = await manager
    .createQueryBuilder(LobbyEntity, 'lobby')
    .where('lobby.status = :status', { status: 'waiting' })
    .andWhere('lobby.playerAgainstId IS NULL')
    .andWhere('lobby.playerForId != :excludeUserId', { excludeUserId: userId })
    .setLock('pessimistic_write')   // SELECT FOR UPDATE
    .getOne();

  if (existing) {
    existing.playerAgainstId = userId;
    await manager.save(LobbyEntity, existing);
    return { lobby, position: 'against' };
  }
  // Créer un nouveau lobby...
});
```

---

## RC-3 — TOCTOU dans `JoinAsRefereeUseCase`

### Fichier concerné
`src/contexts/matchmaking/app/usecases/join-as-referee.usecase.ts`
`src/contexts/matchmaking/infra/lobby.repository.ts`

### Description du problème

**Type :** TOCTOU

Identique à RC-2 mais pour l'arbitre. Deux arbitres pourraient simultanément trouver
le même lobby "sans arbitre" et tous les deux s'y assigner.

```
Thread A (Arbitre A)              Thread B (Arbitre B)
  │                                 │
  ├─ findWaitingLobbyForReferee() → Lobby#1
  │                                 ├─ findWaitingLobbyForReferee() → Lobby#1
  ├─ lobby.startDebate(A)           │
  │                                 ├─ lobby.startDebate(B)
  ├─ save() → refereeId=A           │
  │                                 ├─ save() → refereeId=B (écrase A !)
```

### Solution choisie

**Verrou pessimiste dans une transaction SERIALIZABLE** (même approche que RC-2).

Voir `LobbyRepository.joinRefereeAtomically()`.

---

## RC-4 — Non-atomicité dans `UpdateStatsUseCase`

### Fichier concerné
`src/contexts/auth/app/usecases/update-stats.usecase.ts`
`src/contexts/auth/infra/user.repository.ts`

### Description du problème

**Type :** Lost Update (Non-atomique)

L'ancienne implémentation utilisait le pattern read-modify-write :
```
findById(winner) → winner.wins = 5
                                    findById(winner) → winner.wins = 5
save(winner) → wins = 6
                                    save(winner) → wins = 6  (l'incrément de A est perdu !)
```

Si deux parties se terminent simultanément avec le même gagnant, un incrément de victoire
peut être perdu. De plus, les deux saves (winner, loser) n'étaient pas dans la même transaction :
si le second échoue, le premier est déjà commité (incohérence partielle).

### Solution choisie

**Opération atomique SQL (`UPDATE SET wins = wins + 1`) dans une transaction.**

```sql
BEGIN;
UPDATE users SET wins = wins + 1 WHERE id = :winnerId;
UPDATE users SET losses = losses + 1 WHERE id = :loserId;
COMMIT;
```

L'incrément est fait directement par la base de données, qui garantit l'atomicité.
Pas de lecture préalable, pas de fenêtre de race condition.

**Pourquoi cette solution ?**
- `SET wins = wins + 1` est une opération atomique côté DB (pas de TOCTOU)
- La transaction garantit que winner ET loser sont mis à jour ensemble ou pas du tout
- Beaucoup plus efficace : 2 requêtes au lieu de 4 (2 SELECT + 2 UPDATE)

### Code (dans `UserRepository.atomicIncrementStats`)
```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.createQueryBuilder()
    .update(UserEntity)
    .set({ wins: () => 'wins + 1' })
    .where('id = :id', { id: winnerId })
    .execute();

  await manager.createQueryBuilder()
    .update(UserEntity)
    .set({ losses: () => 'losses + 1' })
    .where('id = :id', { id: loserId })
    .execute();
});
```

---

## RC-5 — Race find-or-create dans `SendDirectMessageUseCase`

### Fichier concerné
`src/contexts/messaging/app/usecases/send-direct-message.usecase.ts`
`src/contexts/messaging/infra/conversation.repository.ts`

### Description du problème

**Type :** Race Condition find-or-create (Duplicate creation)

```
Thread A (Alice → Bob)            Thread B (Bob → Alice)
  │                                 │
  ├─ findByParticipants(A, B) → null │
  │                                 ├─ findByParticipants(B, A) → null
  ├─ save({ user1: A, user2: B })   │
  │                                 ├─ save({ user1: B, user2: A })
  │ → Conversation#1                │ → Conversation#2 (DOUBLON !)
```

Si Alice et Bob s'envoient un premier message exactement en même temps,
deux conversations sont créées entre eux.

### Solution choisie

**Transaction SERIALIZABLE avec retry en cas de conflit (code 40001).**

PostgreSQL avec isolation SERIALIZABLE détecte les anomalies de sérialisation
et annule une des deux transactions avec le code `40001`. On retente jusqu'à 3 fois.
Au deuxième essai, la conversation créée par l'autre transaction est visible.

**Pourquoi cette solution ?**
- L'isolation SERIALIZABLE est la plus forte : elle garantit un résultat équivalent
  à une exécution séquentielle
- Le retry est nécessaire car PostgreSQL peut annuler la transaction (pas de blocage)
- Alternative : contrainte UNIQUE sur (min(user1,user2), max(user1,user2)) + INSERT ON CONFLICT,
  mais cela nécessite de normaliser les IDs

### Code (dans `ConversationRepository.findOrCreateConversation`)
```typescript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    return await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const existing = await manager.getRepository(ConversationEntity).findOne({
        where: [{ user1Id, user2Id }, { user1Id: user2Id, user2Id: user1Id }],
      });
      if (existing) return this.toModel(existing);
      const saved = await manager.save(ConversationEntity, { user1Id, user2Id });
      return this.toModel(saved);
    });
  } catch (err: any) {
    if (err?.code === '40001' && attempt < 2) continue; // serialization failure → retry
    throw err;
  }
}
```

---

## RC-6 — Phantom Read dans `TopicRepository.findRandom()`

### Fichier concerné
`src/contexts/matchmaking/infra/topic.repository.ts`

### Description du problème

**Type :** Phantom Read (Lecture fantôme)

```typescript
// Ancienne implémentation
const count = await this.repo.count();   // → 10 topics
// ← un topic peut être supprimé ici
const skip = Math.floor(Math.random() * count); // → skip = 9
const results = await this.repo.find({ skip, take: 1 }); // → [] (index hors limites !)
```

Entre le `COUNT` et le `FIND`, le nombre de topics peut changer (insertion ou suppression).
Si `skip >= nouveau_count`, la requête retourne une liste vide → le lobby n'a pas de sujet.

### Solution choisie

**Requête unique atomique : `ORDER BY RANDOM() LIMIT 1`.**

```sql
SELECT * FROM topics ORDER BY RANDOM() LIMIT 1;
```

Une seule requête SQL, aucune fenêtre entre deux opérations.

**Pourquoi cette solution ?**
- Atomique par définition (une seule requête)
- Plus simple et plus lisible
- `ORDER BY RANDOM()` est natif PostgreSQL et efficace pour de petites tables
- Élimine complètement la fenêtre de race condition

### Code
```typescript
async findRandom(): Promise<TopicModel | null> {
  const result = await this.repo
    .createQueryBuilder('topic')
    .orderBy('RANDOM()')
    .limit(1)
    .getOne();
  return result ? this.toModel(result) : null;
}
```

---

## RC-7 — État partagé mutable dans `MessagingGateway`

### Fichier concerné
`src/contexts/messaging/api/messaging.gateway.ts`

### Description du problème

**Type :** Race Condition sur état partagé mutable (async interleaving)

La `Map<userId, Set<socketId>>` est modifiée dans `handleConnection` et `handleDisconnect`.
Même si Node.js est mono-thread, les opérations `async/await` créent des points
d'entrelacement. Scénario avec deux connexions simultanées du même utilisateur :

```
Conn A                            Conn B
  │                                 │
  ├─ jwtService.verify() → await    │
  │                                 ├─ jwtService.verify() → await
  ├─ userSockets.has(uid) → false   │
  ├─ userSockets.set(uid, new Set)  │
  ├─ .add(socketA)                  │
  │                                 ├─ userSockets.has(uid) → false ← RELUE AVANT WRITE !
  │                                 ├─ userSockets.set(uid, new Set)  ← ÉCRASE la Set de A !
  │                                 ├─ .add(socketB)
  │
  │ → socketA invisible dans la map (perdu !)
```

Le socket A n'est plus dans la map → les DMs destinés au user ne lui seront pas
routés si socketA est sa seule connexion active.

### Solution choisie

**Mutex asynchrone (`AsyncMutex`) par userId.**

Un mutex sérialise les `handleConnection` et `handleDisconnect` pour le même userId.
La section critique (vérification + modification de la map) s'exécute atomiquement.

**Pourquoi cette solution ?**
- Adapté au contexte in-process (pas besoin de distributed lock)
- Granularité par userId : les connexions de différents users ne se bloquent pas
- L'`AsyncMutex` est léger (pas de threads, pas de spinlock)
- Pattern standard pour protéger des ressources partagées en JavaScript async

### Code
```typescript
private socketMutexes = new Map<string, AsyncMutex>();

async handleConnection(client: Socket) {
  const payload = this.jwtService.verify(token);

  const release = await this.acquireSocketMutex(payload.sub);
  try {
    if (!this.userSockets.has(payload.sub)) {
      this.userSockets.set(payload.sub, new Set());
    }
    this.userSockets.get(payload.sub)!.add(client.id);
  } finally {
    release();
  }
}
```

---

## Système de révocation de Refresh Token

### Fichiers créés
- `src/contexts/auth/infra/entities/refresh-token.entity.ts`
- `src/contexts/auth/app/ports/refresh-token.repository.port.ts`
- `src/contexts/auth/infra/refresh-token.repository.ts`
- `src/contexts/auth/app/usecases/refresh-token.usecase.ts`
- `src/contexts/auth/app/usecases/logout.usecase.ts`

### Endpoints ajoutés
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/login` | Retourne `{ accessToken, refreshToken }` |
| `POST` | `/auth/refresh` | Échange un refresh token contre un nouveau access token |
| `POST` | `/auth/logout` | Révoque le refresh token |

### Architecture

```
Login
  └─ access token (JWT, 15 min) — courte durée, pas stocké
  └─ refresh token (opaque, 64 hex chars) — 7 jours, hash stocké en DB

Refresh
  └─ Valide le refresh token (hash en DB)
  └─ Révoque l'ancien (revokedAt = NOW())
  └─ Émet un nouveau access token + nouveau refresh token (rotation)

Logout
  └─ Révoque le refresh token (revokedAt = NOW())
  └─ Le access token expire naturellement (15 min max)
```

### Sécurité

1. **Token opaque** : le token brut n'est jamais stocké en DB, seulement son hash SHA-256.
   En cas de fuite de la DB, les tokens sont inutilisables.

2. **Rotation systématique** : à chaque refresh, l'ancien token est révoqué et un nouveau
   est émis. Un token volé intercepté ne peut être utilisé qu'une fois.

3. **Détection de compromission** : si un token **déjà révoqué** est présenté,
   tous les tokens de l'utilisateur sont révoqués (protection contre le token reuse attack).

4. **Protection contre la race condition** : un `AsyncMutex` par token sérialise
   les appels concurrents au refresh.

   ```
   Race condition sans mutex :
   Thread A                          Thread B (attaquant)
     │                                 │
     ├─ findByHash(T1) → valid         │
     │                                 ├─ findByHash(T1) → valid  (avant révocation !)
     ├─ revoke(T1)                     │
     ├─ emit T2                        │
     │                                 ├─ revoke(T1) (déjà révoqué, no-op)
     │                                 ├─ emit T3 ← DEUX tokens émis pour T1 !

   Avec mutex :
     Thread A acquiert le mutex → Thread B attend
     Thread A révoque T1, émet T2, libère le mutex
     Thread B acquiert → trouve T1 révoqué → 401 Unauthorized
   ```

### Table `refresh_tokens`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | VARCHAR | Référence à l'utilisateur |
| `tokenHash` | VARCHAR | Hash SHA-256 du token (UNIQUE, indexé) |
| `expiresAt` | TIMESTAMP | Date d'expiration (7 jours) |
| `revokedAt` | TIMESTAMP | NULL si valide, date de révocation sinon |
| `createdAt` | TIMESTAMP | Date de création (auto) |

---

## Récapitulatif des mécanismes utilisés

| Mécanisme | Race Condition corrigée | Fichier |
|-----------|------------------------|---------|
| **Contrainte UNIQUE (DB)** | RC-1 TOCTOU inscription | `register.usecase.ts` |
| **Verrou pessimiste** (SELECT FOR UPDATE) | RC-2 Lost Update joueur | `lobby.repository.ts` |
| **Verrou pessimiste** (SELECT FOR UPDATE) | RC-3 TOCTOU arbitre | `lobby.repository.ts` |
| **Opération atomique SQL** + Transaction | RC-4 Lost Update stats | `user.repository.ts` |
| **Transaction SERIALIZABLE** + retry | RC-5 Race find-or-create | `conversation.repository.ts` |
| **Requête atomique unique** (ORDER BY RANDOM) | RC-6 Phantom Read | `topic.repository.ts` |
| **Mutex asynchrone** | RC-7 Shared mutable state | `messaging.gateway.ts` |
| **Verrou optimiste** (@VersionColumn) | Double désignation gagnant | `designate-winner.usecase.ts` |
| **Mutex asynchrone** + rotation | Race condition refresh token | `refresh-token.usecase.ts` |

### Quand utiliser quel mécanisme ?

| Mécanisme | Cas d'usage | Avantages | Inconvénients |
|-----------|-------------|-----------|---------------|
| **Contrainte DB UNIQUE** | Unicité de données | Atomique, distribué | Erreur à gérer |
| **Verrou pessimiste** | Contention probable, état critique | Sûr, simple | Blocage, deadlock possible |
| **Verrou optimiste** | Contention rare, retry acceptable | Pas de blocage, scalable | Retry en cas de conflit |
| **Transaction atomique SQL** | Agrégats (compteurs) | Très efficace | SQL spécifique |
| **Isolation SERIALIZABLE** | Séquences complexes | Fort, général | Retry nécessaire |
| **Mutex in-process** | État partagé en mémoire | Simple, rapide | Mono-instance uniquement |
| **Requête unique** | Remplacer count+fetch | Simple, atomique | Limité aux cas simples |
