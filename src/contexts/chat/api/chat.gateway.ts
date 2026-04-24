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
import { SendMessageUseCase } from '../app/usecases/send-message.usecase';
import { verifyCustomJwt } from '../../../shared/jwt/jwt.utils';
import { JWT_SECRET } from '../../../shared/jwt/jwt.constants';
import { GetLobbyMessagesUseCase } from '../app/usecases/get-lobby-messages.usecase';
import { MessageType } from '../domain/message.model';
import { has } from '../../../shared/permissions/permission.utils';
import {
  SEND_MESSAGE,
  SEND_REACTION,
  SPECTATE_LOBBY,
} from '../../../shared/permissions/permission.constants';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly sendMessage: SendMessageUseCase,
    private readonly getLobbyMessages: GetLobbyMessagesUseCase,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const payload = verifyCustomJwt(token, JWT_SECRET);
      client.data.userId = payload.sub;
      client.data.username = payload.username;
      client.data.permissions = BigInt(payload.permissions);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  /** Rejoindre un lobby (joueur / arbitre) — présence visible */
  @SubscribeMessage('joinLobby')
  async handleJoinLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string },
  ) {
    client.join(data.lobbyId);
    const messages = await this.getLobbyMessages.execute(data.lobbyId);
    client.emit('lobbyHistory', messages);
  }

  /**
   * Rejoindre un lobby en tant que spectateur invisible (staff).
   * Requiert SPECTATE_LOBBY. La room n'est pas notifiée.
   */
  @SubscribeMessage('spectate')
  async handleSpectate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string },
  ) {
    if (!has(client.data.permissions, SPECTATE_LOBBY)) {
      client.emit('error', { message: 'Permission refusée : SPECTATE_LOBBY requise' });
      return;
    }
    // Rejoint la room silencieusement (pas de broadcast)
    client.join(data.lobbyId);
    const messages = await this.getLobbyMessages.execute(data.lobbyId);
    client.emit('lobbyHistory', messages);
    // Aucun event aux autres membres → spectateur invisible
  }

  /** Envoyer un message chat (joueurs) */
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; content: string },
  ) {
    if (!has(client.data.permissions, SEND_MESSAGE)) {
      client.emit('error', { message: 'Permission refusée : SEND_MESSAGE requise' });
      return;
    }
    const message = await this.sendMessage.execute(
      data.lobbyId, client.data.userId, client.data.username, data.content, MessageType.CHAT,
    );
    this.server.to(data.lobbyId).emit('newMessage', message);
  }

  /** Envoyer une réaction (arbitres) */
  @SubscribeMessage('sendReaction')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; content: string },
  ) {
    if (!has(client.data.permissions, SEND_REACTION)) {
      client.emit('error', { message: 'Permission refusée : SEND_REACTION requise' });
      return;
    }
    const message = await this.sendMessage.execute(
      data.lobbyId, client.data.userId, client.data.username, data.content, MessageType.REACTION,
    );
    this.server.to(data.lobbyId).emit('newMessage', message);
  }

  // ── WebRTC Signaling ────────────────────────────────────────────────────────
  // The back-end acts as a pure signaling relay: it forwards WebRTC offer/answer
  // and ICE candidates between peers in the same lobby room. The actual
  // peer-to-peer media (audio/video) never touches this server.
  //
  // Flow:
  //   1. Caller emits "rtcOffer"  → server relays to the lobby room (except caller).
  //   2. Callee emits "rtcAnswer" → server relays to the lobby room (except callee).
  //   3. Either peer emits "rtcIceCandidate" → server relays to the room.
  // ────────────────────────────────────────────────────────────────────────────

  /** Forward a WebRTC offer to the other peers in the lobby */
  @SubscribeMessage('rtcOffer')
  handleRtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; sdp: RTCSessionDescriptionInit },
  ) {
    client.to(data.lobbyId).emit('rtcOffer', {
      fromUserId: client.data.userId,
      sdp: data.sdp,
    });
  }

  /** Forward a WebRTC answer to the other peers in the lobby */
  @SubscribeMessage('rtcAnswer')
  handleRtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; sdp: RTCSessionDescriptionInit },
  ) {
    client.to(data.lobbyId).emit('rtcAnswer', {
      fromUserId: client.data.userId,
      sdp: data.sdp,
    });
  }

  /** Forward an ICE candidate to the other peers in the lobby */
  @SubscribeMessage('rtcIceCandidate')
  handleRtcIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; candidate: RTCIceCandidateInit },
  ) {
    client.to(data.lobbyId).emit('rtcIceCandidate', {
      fromUserId: client.data.userId,
      candidate: data.candidate,
    });
  }
}
