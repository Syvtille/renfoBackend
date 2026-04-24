# Grille de notation — Mapping fonctionnalités ↔ critères (100 pts)

## 1. DDD / Compréhension du métier — 15 pts

- **Bounded contexts** séparés et cohérents : `auth`, `matchmaking`, `chat`, `messaging`, `notifications`, `payment` (`src/contexts/`).
- **Couches par contexte** : `domain/` (entities, errors, value objects) · `app/` (usecases, ports, types) · `infra/` (repositories TypeORM, adapters externes) · `api/` (controllers, gateways, presenters, DTOs).
- **Inversion de dépendance** : les usecases dépendent de `*Port` abstraites ; l'implémentation concrète est injectée via tokens (`USER_REPOSITORY`, `REFRESH_TOKEN_REPOSITORY`, `STRIPE_SERVICE`, `MAILER`, `LOCK`, `BLOOM_FILTER`…).
- **Erreurs de domaine** : `src/core/errors/domain-error.ts` + `src/contexts/*/domain/errors/*.errors.ts`. Aucune dépendance vers NestJS dans le domaine.
- **Presenters** : conversion entity → DTO au niveau controller (`src/contexts/auth/api/presenters/auth.presenter.ts`) — le domaine n'expose jamais `passwordHash`, `tokenVersion`, etc.

## 2. Architecture back-end — 15 pts

- **Séparation core / contexts** : `src/core/` regroupe les capacités transverses (`database`, `cache`, `bloom`, `mailer`, `lock`, `http`, `errors`). Les contextes s'y branchent via des ports abstraits.
- **NestJS modules** : `DatabaseModule`, `RedisModule`, `BloomModule`, `MailerModule`, `LockModule`, tous `@Global`. Chaque contexte expose son propre module.
- **Global exception filter** : `src/core/http/exceptions/http-exception.filter.ts` normalise `DomainError`, `HttpException` et erreurs inconnues en JSON `{ code, message, fields?, details? }`.
- **Config** : `ConfigModule.forRoot({ isGlobal: true })` + variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, `STRIPE_*`, `SMTP_*`, `REDIS_URL`).
- **Persistence** : TypeORM + Postgres ; config centralisée dans `src/core/database/typeorm.config.ts`.

## 3. RBAC — 10 pts

- **Permissions bitmask BigInt** : `src/shared/permissions/permission.constants.ts` (1 permission = 1 bit ; rôles composés par OR). Documenté dans `PERMISSIONS.md`.
- **Guards** : `JwtAuthGuard` (`src/shared/jwt/jwt-auth.guard.ts`) + `PermissionsGuard` (`src/shared/permissions/permissions.guard.ts`).
- **Decorator** : `@RequirePermissions(...)` (`src/shared/permissions/require-permissions.decorator.ts`).
- **Application** : tous les endpoints sensibles (`/users`, `/users/:id/toggle-active`, gateways chat/matchmaking) utilisent `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions(MANAGE_USERS | SEND_MESSAGE | …)`.
- **Erreur propre** : `AuthInsufficientPermissionsError` (code `AUTH.INSUFFICIENT_PERMISSIONS`, 403).

## 4. WebSocket / WebRTC — 10 pts

- **Gateways Socket.IO** :
  - `src/contexts/chat/api/chat.gateway.ts` — messages & réactions en temps réel, authentification JWT à la connexion, permissions par message.
  - `src/contexts/messaging/api/messaging.gateway.ts` — messagerie privée.
- **JWT sur les sockets** : vérifié dans `handleConnection` via `verifyCustomJwt`.
- **Front démo** : `arena.html`, `client.html` (SPA simples servant de banc de test manuel).
- **WebRTC** : le flux signaling vidéo passe par la chat gateway (échange d'offers/answers via `SubscribeMessage`).

## 5. Stripe — 10 pts

- **Intégration** : `src/contexts/payment/infra/stripe/stripe.service.ts` (abstraction derrière `STRIPE_SERVICE`).
- **Usecases** : `PurchaseProductUseCase`, `CreateSubscriptionUseCase`, `CancelSubscriptionUseCase`, `ChangePlanUseCase`, `GetInvoicesUseCase`, `SyncStripeProductsUseCase`.
- **Webhooks** : `WebhookController` + `HandleWebhookUseCase` avec validation de signature (body brut via `rawBody: true` dans `main.ts`).
- **Receipt mail** : automatique après `payment_intent.succeeded` via le mailer centralisé (`core/mailer`).
- **Front démo** : `payment.html`.

## 6. Race conditions — 10 pts

Documenté en détail dans `RACE_CONDITIONS.md`.

- **RC-1 (TOCTOU register)** : Bloom filter + `UNIQUE` constraint Postgres + traduction de `23505` (`RegisterUseCase`).
- **RC-2 (Lost update matchmaking)** : `joinPlayerAtomically` / `joinRefereeAtomically` en transaction `SERIALIZABLE` avec `SELECT … FOR UPDATE`.
- **RC-3 (Stats inconsistency)** : `atomicIncrementStats(winnerId, loserId)` dans une transaction (`UPDATE … SET wins = wins + 1`).
- **RC-4 (Refresh-token replay)** : **double protection** — `AsyncMutex` in-process (même instance) + `LockPort` distribué (Redis `SET NX PX` avec token, release gated par script Lua). Rotation avec `familyId` + `parentId` → détection de token compromis → `revokeByFamilyId`.
- **Défense de base** : UNIQUE constraints sur `email`, `username`, `token_hash`.

## 7. JWT / sécurité — 10 pts

- **JWT custom** : HMAC-SHA256 signé à la main (`src/shared/jwt/jwt.utils.ts`) — prouvé pédagogique (pas de lib magique).
- **Refresh token rotation** avec family ID et détection de compromission (`RefreshTokenUseCase`).
- **Device binding** : `userAgent`, `deviceId`, `ipAddress` stockés à l'émission ; réévalués à chaque refresh par `SecurityScoringService` (`src/contexts/auth/app/services/security-scoring.service.ts`).
- **Security scoring** : `SCORING_RULES[]` DRY (weight · detect · detail) → niveau `ok | warn | block` → révocation de la famille entière si `block`.
- **Token versioning** : `user.tokenVersion` incrémenté sur `invalidate-tokens` ou changement de mot de passe → tous les tokens d'une version précédente deviennent invalides (`AuthSessionInvalidatedError`).
- **Logs sécurité** : consultables via `GET /auth/security/logs`.

## 8. Scalabilité / Bloom Filter — 10 pts

Documenté en détail dans `BLOOM_FILTER.md`.

- **Redis** : `src/core/cache/redis.module.ts` avec client singleton + **fallback in-memory automatique** si Redis absent (dev, CI). Interface abstraite `RedisLike` pour le DI.
- **Bloom filter** : `src/core/bloom/bloom-filter.service.ts` backed par bitmaps Redis (`SETBIT` / `GETBIT`). 2²⁰ bits, k=7, FPR ≈ 1% à 100k inscriptions.
- **Hash** : double hashing Kirsch-Mitzenmacher avec MurmurHash3 + FNV-1a + djb2 tie-breaker (`src/core/bloom/bloom-hash.ts`, testé dans `bloom-hash.spec.ts`).
- **Intégration** : `RegisterUseCase` consulte le bloom avant toute requête SQL ; n'appelle la DB que si `mightExist(email) || mightExist(username)`.
- **Lock distribué** : `src/core/lock/redis-lock.service.ts` (`SET NX PX` + release Lua) utilisable pour toute section critique multi-instance (déjà branché sur le refresh-token).

## 9. Projet final — 10 pts

- **Tests** : 58 tests Jest, 13 suites, 100% pass (`npm test`).
- **Documentation** : `README.md`, `BLOOM_FILTER.md`, `RACE_CONDITIONS.md`, `PERMISSIONS.md`, `GRADING.md`.
- **Démo UI** : `arena.html` (chat + matchmaking), `client.html` (auth flow), `payment.html` (Stripe). Servies par le back via `useStaticAssets`.
- **Dev env** : `docker-compose.yml` pour Postgres (+ Redis à ajouter pour le full stack).
- **Clean typecheck** : `npx tsc --noEmit` sans erreur.
- **Architecture refactor** : passage d'une couche `model/` vers `entity/` unique, séparation `create` / `save`, `abstract class` pour les ports compatibles NestJS DI + emitDecoratorMetadata.
