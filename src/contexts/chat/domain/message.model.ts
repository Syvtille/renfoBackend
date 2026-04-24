/**
 * Types de messages dans un lobby.
 */
export enum MessageType {
  CHAT = 'chat',
  REACTION = 'reaction',
  SYSTEM = 'system',
}

/**
 * Modèle de domaine Message — logique métier pure.
 */
export class MessageModel {
  constructor(
    public readonly id: string,
    public readonly lobbyId: string,
    public readonly senderId: string,
    public senderUsername: string,
    public readonly content: string,
    public readonly type: MessageType,
    public readonly createdAt: Date,
  ) {}

  changeSenderUsername(username: string): void {
    this.senderUsername = username;
  }
}
