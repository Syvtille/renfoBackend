# Graph Report - .  (2026-04-23)

## Corpus Check
- Corpus is ~33,143 words - fits in a single context window. You may not need a graph.

## Summary
- 727 nodes · 830 edges · 57 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 171 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth Controller & API|Auth Controller & API]]
- [[_COMMUNITY_Payment & Subscription Lifecycle|Payment & Subscription Lifecycle]]
- [[_COMMUNITY_Real-time Chat & Concurrency|Real-time Chat & Concurrency]]
- [[_COMMUNITY_Arena Frontend & UI|Arena Frontend & UI]]
- [[_COMMUNITY_Payment Webhooks & Cancellation|Payment Webhooks & Cancellation]]
- [[_COMMUNITY_Matchmaking Lobbies|Matchmaking Lobbies]]
- [[_COMMUNITY_Products & Purchase Flow|Products & Purchase Flow]]
- [[_COMMUNITY_Data Listing Queries|Data Listing Queries]]
- [[_COMMUNITY_User Registration|User Registration]]
- [[_COMMUNITY_User Model & Permissions|User Model & Permissions]]
- [[_COMMUNITY_User Data Retrieval|User Data Retrieval]]
- [[_COMMUNITY_Lobby & Winner Designation|Lobby & Winner Designation]]
- [[_COMMUNITY_Contact Management|Contact Management]]
- [[_COMMUNITY_Read Status Tracking|Read Status Tracking]]
- [[_COMMUNITY_Direct Messaging Send|Direct Messaging Send]]
- [[_COMMUNITY_Payment Ports & Stripe|Payment Ports & Stripe]]
- [[_COMMUNITY_Content Creation|Content Creation]]
- [[_COMMUNITY_JWT Authentication|JWT Authentication]]
- [[_COMMUNITY_Message Retrieval|Message Retrieval]]
- [[_COMMUNITY_Race Condition Analysis|Race Condition Analysis]]
- [[_COMMUNITY_Lobby Chat Messages|Lobby Chat Messages]]
- [[_COMMUNITY_Payment DTOs|Payment DTOs]]
- [[_COMMUNITY_Security Scoring|Security Scoring]]
- [[_COMMUNITY_Chat Message Model|Chat Message Model]]
- [[_COMMUNITY_Auth DTOs|Auth DTOs]]
- [[_COMMUNITY_Topic Model & Port|Topic Model & Port]]
- [[_COMMUNITY_Messaging DTOs|Messaging DTOs]]
- [[_COMMUNITY_Contact Domain Model|Contact Domain Model]]
- [[_COMMUNITY_Conversation Model|Conversation Model]]
- [[_COMMUNITY_Direct Message Model|Direct Message Model]]
- [[_COMMUNITY_Notification Model|Notification Model]]
- [[_COMMUNITY_Credential Scripts|Credential Scripts]]
- [[_COMMUNITY_API Test Scripts|API Test Scripts]]
- [[_COMMUNITY_App Module Root|App Module Root]]
- [[_COMMUNITY_Application Bootstrap|Application Bootstrap]]
- [[_COMMUNITY_Auth Module|Auth Module]]
- [[_COMMUNITY_User Entity|User Entity]]
- [[_COMMUNITY_Chat Module|Chat Module]]
- [[_COMMUNITY_Message Entity|Message Entity]]
- [[_COMMUNITY_Matchmaking Module|Matchmaking Module]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]
- [[_COMMUNITY_Ts|Ts]]

## God Nodes (most connected - your core abstractions)
1. `AuthController` - 14 edges
2. `PaymentController` - 14 edges
3. `StripeService` - 13 edges
4. `has()` - 13 edges
5. `UserRepository` - 12 edges
6. `LobbyRepository` - 12 edges
7. `UserModel` - 10 edges
8. `LobbyModel` - 10 edges
9. `ConversationRepository` - 10 edges
10. `SubscriptionModel` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Auth Module (payment.html)` --semantically_similar_to--> `Auth Module (Login/Register)`  [INFERRED] [semantically similar]
  payment.html → arena.html
- `JWT Auth (login/register/refresh/logout)` --semantically_similar_to--> `Auth Module (Login/Register)`  [INFERRED] [semantically similar]
  public/index.html → arena.html
- `Socket.IO Client (client.html)` --semantically_similar_to--> `Chat WebSocket (Socket.IO)`  [INFERRED] [semantically similar]
  client.html → arena.html
- `JWT Auth (login/register/refresh/logout)` --references--> `Refresh Token Revocation System`  [INFERRED]
  public/index.html → RACE_CONDITIONS.md
- `NestJS Project README` --references--> `Backend Server (localhost:3000)`  [INFERRED]
  README.md → arena.html

## Hyperedges (group relationships)
- **Arena Real-time Communication Stack** — arena_chat_socket, arena_msg_socket, arena_sse [INFERRED 0.90]
- **Pessimistic Lock Solutions for Matchmaking** — rc2_lost_update_player, rc3_toctou_referee, rc_rationale_pessimistic_lock [EXTRACTED 1.00]
- **Permission Enforcement Across HTTP and WebSocket** — permissions_guard_nestjs, permissions_ws_check, arena_permissions_check [INFERRED 0.85]

## Communities

### Community 0 - "Auth Controller & API"
Cohesion: 0.05
Nodes (8): AuthController, CreateTopicDto, DesignateWinnerDto, MatchmakingController, MessagingController, PaymentController, SyncStripeProductsUseCase, WebhookController

### Community 1 - "Payment & Subscription Lifecycle"
Cohesion: 0.04
Nodes (7): ChangePlanUseCase, CreateCustomerUseCase, CreateProductUseCase, CreateSubscriptionUseCase, GetInvoicesUseCase, StripeService, SubscriptionModel

### Community 2 - "Real-time Chat & Concurrency"
Cohesion: 0.05
Nodes (8): AsyncMutex, ChatGateway, MessagingGateway, NotificationEmitter, NotificationsController, has(), PermissionsGuard, RemoveContactUseCase

### Community 3 - "Arena Frontend & UI"
Cohesion: 0.06
Nodes (42): Auth Module (Login/Register), Chat WebSocket (Socket.IO), CLASH Arena Frontend, JWT Parser (parseJWT), Matchmaking REST API, Messaging REST API, Messaging WebSocket, Notifications REST API (+34 more)

### Community 4 - "Payment Webhooks & Cancellation"
Cohesion: 0.08
Nodes (5): CancelSubscriptionUseCase, HandleWebhookUseCase, LogoutUseCase, PaymentRepository, SubscriptionRepository

### Community 5 - "Matchmaking Lobbies"
Cohesion: 0.08
Nodes (4): JoinAsPlayerUseCase, JoinAsRefereeUseCase, LobbyRepository, TopicRepository

### Community 6 - "Products & Purchase Flow"
Cohesion: 0.07
Nodes (5): EmailService, GetStatsUseCase, ProductModel, PurchaseProductUseCase, SendPaymentReceiptUseCase

### Community 7 - "Data Listing Queries"
Cohesion: 0.09
Nodes (4): ListProductsUseCase, ListTopicsUseCase, ListUsersUseCase, ProductRepository

### Community 8 - "User Registration"
Cohesion: 0.11
Nodes (3): RegisterUseCase, UpdateStatsUseCase, UserRepository

### Community 9 - "User Model & Permissions"
Cohesion: 0.1
Nodes (4): add(), remove(), ToggleUserActiveUseCase, UserModel

### Community 10 - "User Data Retrieval"
Cohesion: 0.1
Nodes (4): GetConversationsUseCase, GetNotificationsUseCase, GetUserPaymentsUseCase, GetUserSubscriptionUseCase

### Community 11 - "Lobby & Winner Designation"
Cohesion: 0.12
Nodes (2): DesignateWinnerUseCase, LobbyModel

### Community 12 - "Contact Management"
Cohesion: 0.12
Nodes (3): AddContactUseCase, ContactRepository, ListContactsUseCase

### Community 13 - "Read Status Tracking"
Cohesion: 0.12
Nodes (3): MarkMessagesReadUseCase, MarkNotificationReadUseCase, NotificationRepository

### Community 14 - "Direct Messaging Send"
Cohesion: 0.16
Nodes (2): ConversationRepository, SendDirectMessageUseCase

### Community 15 - "Payment Ports & Stripe"
Cohesion: 0.12
Nodes (1): PaymentModel

### Community 16 - "Content Creation"
Cohesion: 0.12
Nodes (3): CreateNotificationUseCase, CreateTopicUseCase, SendMessageUseCase

### Community 17 - "JWT Authentication"
Cohesion: 0.19
Nodes (7): JwtAuthGuard, base64urlDecode(), base64urlEncode(), hmacSha256Base64url(), signCustomJwt(), verifyCustomJwt(), LoginUseCase

### Community 18 - "Message Retrieval"
Cohesion: 0.17
Nodes (2): DirectMessageRepository, GetDirectMessagesUseCase

### Community 19 - "Race Condition Analysis"
Cohesion: 0.21
Nodes (13): Race Conditions Analysis & Solutions, RC-1 TOCTOU in RegisterUseCase, RC-2 Lost Update in JoinAsPlayerUseCase, RC-3 TOCTOU in JoinAsRefereeUseCase, RC-4 Non-atomicity in UpdateStatsUseCase, RC-5 Race find-or-create in SendDirectMessageUseCase, RC-6 Phantom Read in TopicRepository.findRandom, RC-7 Shared Mutable State in MessagingGateway (+5 more)

### Community 20 - "Lobby Chat Messages"
Cohesion: 0.18
Nodes (2): GetLobbyMessagesUseCase, MessageRepository

### Community 21 - "Payment DTOs"
Cohesion: 0.43
Nodes (6): BillingAddressDto, ChangePlanDto, CreateCustomerDto, CreateProductDto, CreateSubscriptionDto, PurchaseProductDto

### Community 22 - "Security Scoring"
Cohesion: 0.29
Nodes (1): SecurityScoringService

### Community 23 - "Chat Message Model"
Cohesion: 0.29
Nodes (1): MessageModel

### Community 24 - "Auth DTOs"
Cohesion: 0.53
Nodes (4): LoginDto, LogoutDto, RefreshTokenDto, RegisterDto

### Community 25 - "Topic Model & Port"
Cohesion: 0.33
Nodes (1): TopicModel

### Community 26 - "Messaging DTOs"
Cohesion: 0.67
Nodes (2): AddContactDto, SendDmDto

### Community 27 - "Contact Domain Model"
Cohesion: 0.5
Nodes (1): ContactModel

### Community 28 - "Conversation Model"
Cohesion: 0.5
Nodes (1): ConversationModel

### Community 29 - "Direct Message Model"
Cohesion: 0.5
Nodes (1): DirectMessageModel

### Community 30 - "Notification Model"
Cohesion: 0.5
Nodes (1): NotificationModel

### Community 31 - "Credential Scripts"
Cohesion: 0.67
Nodes (1): test()

### Community 32 - "API Test Scripts"
Cohesion: 0.67
Nodes (1): testApi()

### Community 33 - "App Module Root"
Cohesion: 0.67
Nodes (1): AppModule

### Community 34 - "Application Bootstrap"
Cohesion: 0.67
Nodes (1): bootstrap()

### Community 35 - "Auth Module"
Cohesion: 0.67
Nodes (1): AuthModule

### Community 36 - "User Entity"
Cohesion: 0.67
Nodes (1): UserEntity

### Community 37 - "Chat Module"
Cohesion: 0.67
Nodes (1): ChatModule

### Community 38 - "Message Entity"
Cohesion: 0.67
Nodes (1): MessageEntity

### Community 39 - "Matchmaking Module"
Cohesion: 0.67
Nodes (1): MatchmakingModule

### Community 40 - "Ts"
Cohesion: 0.67
Nodes (1): makeLobby()

### Community 41 - "Ts"
Cohesion: 0.67
Nodes (1): makeLobby()

### Community 42 - "Ts"
Cohesion: 0.67
Nodes (1): LobbyEntity

### Community 43 - "Ts"
Cohesion: 0.67
Nodes (1): TopicEntity

### Community 44 - "Ts"
Cohesion: 0.67
Nodes (1): MessagingModule

### Community 45 - "Ts"
Cohesion: 0.67
Nodes (1): ContactEntity

### Community 46 - "Ts"
Cohesion: 0.67
Nodes (1): ConversationEntity

### Community 47 - "Ts"
Cohesion: 0.67
Nodes (1): DirectMessageEntity

### Community 48 - "Ts"
Cohesion: 0.67
Nodes (1): NotificationsModule

### Community 49 - "Ts"
Cohesion: 0.67
Nodes (1): NotificationEntity

### Community 50 - "Ts"
Cohesion: 0.67
Nodes (1): PaymentModule

### Community 51 - "Ts"
Cohesion: 0.67
Nodes (1): makePayment()

### Community 52 - "Ts"
Cohesion: 0.67
Nodes (1): makeSub()

### Community 53 - "Ts"
Cohesion: 0.67
Nodes (1): PaymentEntity

### Community 54 - "Ts"
Cohesion: 0.67
Nodes (1): ProductEntity

### Community 55 - "Ts"
Cohesion: 0.67
Nodes (1): SubscriptionEntity

### Community 56 - "Ts"
Cohesion: 0.67
Nodes (1): RequirePermissions()

## Knowledge Gaps
- **21 isolated node(s):** `Messaging WebSocket`, `SSE Notification Stream`, `Messaging REST API`, `Notifications REST API`, `ClashChat WebSocket Tester` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Lobby & Winner Designation`** (18 nodes): `lobby.repository.port.ts`, `designate-winner.usecase.ts`, `lobby.model.ts`, `DesignateWinnerUseCase`, `.constructor()`, `.execute()`, `LobbyModel`, `.addPlayerAgainst()`, `.constructor()`, `.designateWinner()`, `.getLoserId()`, `.isPlayer()`, `.needsPlayer()`, `.needsReferee()`, `.startDebate()`, `lobby.repository.port.ts`, `designate-winner.usecase.ts`, `lobby.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Direct Messaging Send`** (16 nodes): `send-direct-message.usecase.ts`, `conversation.repository.ts`, `ConversationRepository`, `.constructor()`, `.findById()`, `.findByParticipants()`, `.findByUserId()`, `.findOrCreateConversation()`, `.save()`, `.toModel()`, `.updateLastMessageAt()`, `SendDirectMessageUseCase`, `.constructor()`, `.execute()`, `send-direct-message.usecase.ts`, `conversation.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Payment Ports & Stripe`** (16 nodes): `email.service.port.ts`, `payment.repository.port.ts`, `stripe.service.port.ts`, `payment-status.enum.ts`, `payment.model.ts`, `PaymentModel`, `.constructor()`, `.isCompleted()`, `.markFailed()`, `.markRefunded()`, `.markSucceeded()`, `email.service.port.ts`, `payment.repository.port.ts`, `stripe.service.port.ts`, `payment-status.enum.ts`, `payment.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Message Retrieval`** (13 nodes): `get-direct-messages.usecase.ts`, `direct-message.repository.ts`, `DirectMessageRepository`, `.constructor()`, `.findByConversationId()`, `.markAsRead()`, `.save()`, `.toModel()`, `GetDirectMessagesUseCase`, `.constructor()`, `.execute()`, `get-direct-messages.usecase.ts`, `direct-message.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lobby Chat Messages`** (12 nodes): `get-lobby-messages.usecase.ts`, `message.repository.ts`, `GetLobbyMessagesUseCase`, `.constructor()`, `.execute()`, `MessageRepository`, `.constructor()`, `.findByLobbyId()`, `.save()`, `.toModel()`, `get-lobby-messages.usecase.ts`, `message.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Security Scoring`** (7 nodes): `.getSecurityLogs()`, `security-scoring.service.ts`, `SecurityScoringService`, `.evaluate()`, `.getAllLogs()`, `.getLogsForUser()`, `security-scoring.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chat Message Model`** (7 nodes): `message.repository.port.ts`, `message.model.ts`, `MessageModel`, `.changeSenderUsername()`, `.constructor()`, `message.repository.port.ts`, `message.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Topic Model & Port`** (6 nodes): `topic.repository.port.ts`, `topic.model.ts`, `topic.repository.port.ts`, `topic.model.ts`, `TopicModel`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Messaging DTOs`** (4 nodes): `messaging.dto.ts`, `AddContactDto`, `SendDmDto`, `messaging.dto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contact Domain Model`** (4 nodes): `contact.model.ts`, `ContactModel`, `.constructor()`, `contact.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Conversation Model`** (4 nodes): `conversation.model.ts`, `ConversationModel`, `.constructor()`, `conversation.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Direct Message Model`** (4 nodes): `direct-message.model.ts`, `DirectMessageModel`, `.constructor()`, `direct-message.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Notification Model`** (4 nodes): `notification.model.ts`, `NotificationModel`, `.constructor()`, `notification.model.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Credential Scripts`** (3 nodes): `get_creds.js`, `get_creds.js`, `test()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Test Scripts`** (3 nodes): `test_api.js`, `test_api.js`, `testApi()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Module Root`** (3 nodes): `AppModule`, `app.module.ts`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Application Bootstrap`** (3 nodes): `main.ts`, `bootstrap()`, `main.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Module`** (3 nodes): `AuthModule`, `auth.module.ts`, `auth.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Entity`** (3 nodes): `user.entity.ts`, `user.entity.ts`, `UserEntity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chat Module`** (3 nodes): `chat.module.ts`, `ChatModule`, `chat.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Message Entity`** (3 nodes): `message.entity.ts`, `MessageEntity`, `message.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Matchmaking Module`** (3 nodes): `matchmaking.module.ts`, `MatchmakingModule`, `matchmaking.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `designate-winner.usecase.spec.ts`, `makeLobby()`, `designate-winner.usecase.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `join-as-player.usecase.spec.ts`, `makeLobby()`, `join-as-player.usecase.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `lobby.entity.ts`, `LobbyEntity`, `lobby.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `topic.entity.ts`, `topic.entity.ts`, `TopicEntity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `messaging.module.ts`, `MessagingModule`, `messaging.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `contact.entity.ts`, `ContactEntity`, `contact.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `conversation.entity.ts`, `ConversationEntity`, `conversation.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `direct-message.entity.ts`, `DirectMessageEntity`, `direct-message.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `notifications.module.ts`, `NotificationsModule`, `notifications.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `notification.entity.ts`, `NotificationEntity`, `notification.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `payment.module.ts`, `PaymentModule`, `payment.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `payment.model.spec.ts`, `makePayment()`, `payment.model.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `subscription.model.spec.ts`, `subscription.model.spec.ts`, `makeSub()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `payment.entity.ts`, `PaymentEntity`, `payment.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `product.entity.ts`, `ProductEntity`, `product.entity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `subscription.entity.ts`, `subscription.entity.ts`, `SubscriptionEntity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ts`** (3 nodes): `require-permissions.decorator.ts`, `RequirePermissions()`, `require-permissions.decorator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SubscriptionRepository` connect `Payment Webhooks & Cancellation` to `Content Creation`, `User Data Retrieval`, `Products & Purchase Flow`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `has()` connect `Real-time Chat & Concurrency` to `User Model & Permissions`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `has()` (e.g. with `.hasPermission()` and `.handleSpectate()`) actually correct?**
  _`has()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Messaging WebSocket`, `SSE Notification Stream`, `Messaging REST API` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Controller & API` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Payment & Subscription Lifecycle` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Real-time Chat & Concurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._