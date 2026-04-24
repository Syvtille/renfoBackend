/**
 * Modèle de domaine Conversation — conversation privée 1-to-1.
 */
export class ConversationModel {
  constructor(
    public readonly id: string,
    public readonly user1Id: string,
    public readonly user2Id: string,
    public readonly lastMessageAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
