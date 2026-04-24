/**
 * Modèle de domaine DirectMessage — message privé entre 2 utilisateurs.
 */
export class DirectMessageModel {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly senderUsername: string,
    public readonly content: string,
    public readonly readAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
