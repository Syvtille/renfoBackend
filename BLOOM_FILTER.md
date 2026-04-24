# Bloom Filter — Register Scalability

## Problème

À chaque `POST /auth/register`, on vérifie que l'email et le username ne sont pas déjà pris. L'implémentation naïve fait **deux `SELECT` sur la table `users`** avant même de songer à écrire. À l'échelle (plusieurs milliers d'inscriptions par heure, des bots qui spamment), ces lectures inutiles saturent le pool de connexions et ajoutent une latence sur le chemin critique — alors que **99% des emails n'existent tout simplement pas** dans la base.

Un Bloom filter répond exactement à cette question *"est-ce que X pourrait exister ?"* en O(1), sans toucher à la base.

## Fonctionnement

Une structure de bits (ici 2²⁰ = 1 048 576 bits ≈ 131 KB par namespace) et `k` fonctions de hash. Pour ajouter un élément : on hash, on calcule `k` positions, on met ces bits à 1. Pour tester : on vérifie les `k` bits. **Si un seul bit vaut 0 → l'élément n'est PAS dans le set (garanti).** Si tous valent 1 → il est *probablement* dans le set (faux positif possible).

Propriétés :
- **Pas de faux négatif** : si le bloom dit "absent", c'est absent pour de vrai. On peut donc sauter la requête SQL.
- **Faux positifs possibles** : on retombe alors sur la requête SQL comme garde-fou. Pas de casse fonctionnelle, juste un cache-miss.
- **Pas de suppression** : retirer un bit casserait d'autres éléments partageant ce bit. Acceptable pour les emails (on ne supprime jamais un email du bloom, même si l'user est supprimé — ça créé juste un faux positif bénin).

## Hash functions

Double hashing (Kirsch & Mitzenmacher, 2006) :

```
h_i(x) = (h1(x) + i * h2(x))  mod  m
```

On ne calcule que **deux hashes réels** (MurmurHash3 et FNV-1a) + un tie-breaker djb2 pour éviter `h2 == 0` qui collapserait toutes les positions sur la même. Mathematiquement équivalent à `k` hashes indépendants pour le taux de faux positifs. Trois fonctions choisies pour leur bonne dispersion et leur vitesse en pur JS :

- **MurmurHash3 (32-bit)** : excellent, quasi aléatoire, rapide. Hash principal.
- **FNV-1a** : simple, bonne dispersion sur courts textes (emails). Pas d'état, très rapide.
- **djb2** : fallback si FNV-1a retourne 0 (rare).

## Dimensionnement

```
m = -n * ln(p) / (ln 2)²      (bits)
k = (m / n) * ln 2             (nombre de hashes)
```

Avec :
- `n` = 100 000 inscriptions attendues
- `p` = 1% (taux de faux positif cible)

→ `m ≈ 958 506 bits` (arrondi à 2²⁰ = 1 048 576 pour avoir un modulo power-of-2 stable)
→ `k = 7 hashes`

À 100 000 inscrits, le taux de faux positifs réel est ≈ **0.8%**. À 200 000 il monte à ≈ 4.5%, à 500 000 il explose — il faudrait alors redimensionner.

## Intégration

```
┌─────────────┐   mightExist?      ┌──────────┐
│  Register   │ ─────────────────▶ │  Bloom   │
│  UseCase    │ ◀─────────────────┤ (Redis) │
└──────┬──────┘   no → skip DB      └──────────┘
       │ maybe
       ▼
┌─────────────┐   SELECT             ┌──────────┐
│  Postgres   │ ◀─────────────────── │ Register │
│ (UNIQUE idx)│ ───────────────────▶ │ UseCase  │
└─────────────┘                      └──────────┘
```

Étapes dans `RegisterUseCase.execute()` :

1. `bloom.mightExist(email)` + `bloom.mightExist(username)` en parallèle.
2. Si **les deux** sont à `false` → skip le `SELECT`. Coût : 2 Redis `GETBIT` par hash ≈ 14 round-trips max (≈ 1-2ms en local).
3. Si **au moins un** est à `true` → on fait le `SELECT` correspondant pour confirmer ou infirmer.
4. Après `save()` réussi → `bloom.add(email)` + `bloom.add(username)`.
5. **Défense en profondeur** : la contrainte `UNIQUE` Postgres reste la source de vérité. Si deux requêtes arrivent en même temps et passent toutes les deux le bloom filter (parce que l'autre n'a pas encore `add`-é), `INSERT` lèvera `23505` et on le traduit en `AuthEmailAlreadyTakenError`. Le bloom filter n'est qu'un *cache* pour éviter la requête ; la consistance stricte est assurée par la base.

## Stockage Redis

Chaque namespace (`user:email`, `user:username`) est un bitmap Redis dédié avec commandes natives `SETBIT` / `GETBIT` (O(1)). Aucun TTL : la structure est cumulative et doit survivre aux restarts. En cas de perte de données Redis, on peut **reconstruire le bloom** en repassant sur toute la table `users` au démarrage (non implémenté ici — OK pour un premier jet, à ajouter si le déploiement devient multi-AZ).

## Fallback in-memory

Si Redis n'est pas joignable, `RedisModule` bascule sur un fallback in-memory (`InMemoryRedis`). Toutes les opérations restent fonctionnelles, mais :
- le state est perdu au restart
- il n'y a plus de partage entre instances (dans un setup scale-out chaque instance a son propre bloom, donc plus de mutualisation — chaque instance ré-apprend à chaud)

Acceptable pour la dev et les tests ; en prod, Redis est requis pour tirer la valeur complète.

## Limites & évolutions

- **Pas de suppression** : si un email est supprimé, le bloom en garde trace. Pour résoudre : passer à un **Counting Bloom Filter** (chaque cellule est un compteur au lieu d'un bit) ou un **Cuckoo filter**. Coût : ×4 mémoire. Pas nécessaire ici puisqu'on autorise les faux positifs.
- **Redimensionnement** : pas de resize en place. Pour un redimensionnement lisse il faudrait un **scalable bloom filter** (empilement de bloom filters à capacités croissantes). Non implémenté — on assume `n ≤ 100k` pour ce projet ; au-delà, redémarrer avec `m` plus grand et rejouer le backfill.
- **Rate limiting** : on peut additionner un compteur Redis (`INCR` + `EXPIRE`) pour bloquer un bot qui spammerait des emails aléatoires et ferait exploser le bloom. Non implémenté, mais l'infra est prête.
