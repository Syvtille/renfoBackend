import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SendDirectMessageUseCase } from '../app/usecases/send-direct-message.usecase';
import { verifyCustomJwt } from '../../../shared/jwt/jwt.utils';
import { JWT_SECRET } from '../../../shared/jwt/jwt.constants';
import { MarkMessagesReadUseCase } from '../app/usecases/mark-messages-read.usecase';
import { AsyncMutex } from '../../../shared/mutex/async-mutex';

/**
 * WebSocket Gateway dédié à la messagerie privée.
 * Namespace : /messaging (séparé du chat lobby)
 */
@WebSocketGateway({ cors: true, namespace: '/messaging' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  /** Map userId → Set<socketId> pour retrouver les sockets d'un user */
  private userSockets = new Map<string, Set<string>>();

  /**
   * FIX RC-7 (État partagé mutable) : mutex par userId pour sérialiser
   * les handleConnection/handleDisconnect concurrents du même utilisateur.
   *
   * Même si Node.js est mono-thread, deux connexions WebSocket du même
   * utilisateur peuvent s'entrelacer de façon asynchrone pendant le verify JWT.
   * Sans mutex, la séquence suivante peut arriver :
   *   1. Conn A : jwtService.verify() (async) → await...
   *   2. Conn B : jwtService.verify() (async) → await...
   *   3. Conn A résout : userSockets.has(userId) → false → crée new Set() → add(A)
   *   4. Conn B résout : userSockets.has(userId) → false → crée new Set() → add(B)
   *      → la Set de A est écrasée, A disparaît de la map !
   */
  private socketMutexes = new Map<string, AsyncMutex>();

  constructor(
    private readonly sendDm: SendDirectMessageUseCase,
    private readonly markRead: MarkMessagesReadUseCase,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const payload = verifyCustomJwt(token, JWT_SECRET);
      client.data.userId = payload.sub;
      client.data.username = payload.username;

      // Section critique : protège l'accès concurrent à userSockets pour ce userId
      const release = await this.acquireSocketMutex(payload.sub);
      try {
        if (!this.userSockets.has(payload.sub)) {
          this.userSockets.set(payload.sub, new Set());
        }
        this.userSockets.get(payload.sub)!.add(client.id);
      } finally {
        release();
      }

      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;

    const release = await this.acquireSocketMutex(userId);
    try {
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId)!.delete(client.id);
        if (this.userSockets.get(userId)!.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    } finally {
      release();
      // Nettoyage du mutex si inactif
      const mutex = this.socketMutexes.get(userId);
      if (mutex?.isIdle) this.socketMutexes.delete(userId);
    }
  }

  private async acquireSocketMutex(userId: string): Promise<() => void> {
    if (!this.socketMutexes.has(userId)) {
      this.socketMutexes.set(userId, new AsyncMutex());
    }
    return this.socketMutexes.get(userId)!.acquire();
  }

  /**
   * Envoyer un message privé.
   * Payload : { recipientId: string, content: string }
   */
  @SubscribeMessage('sendDM')
  async handleSendDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; content: string },
  ) {
    const { conversation, message } = await this.sendDm.execute(
      client.data.userId,
      client.data.username,
      data.recipientId,
      data.content,
    );

    // Émettre au destinataire (s'il est connecté)
    this.server.to(`user:${data.recipientId}`).emit('newDM', { conversation, message });
    // Émettre aussi à l'expéditeur (confirmation)
    client.emit('newDM', { conversation, message });
  }

  /**
   * Marquer les messages d'une conversation comme lus.
   * Payload : { conversationId: string }
   */
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.markRead.execute(data.conversationId, client.data.userId);
    client.emit('messagesRead', { conversationId: data.conversationId });
  }
}
