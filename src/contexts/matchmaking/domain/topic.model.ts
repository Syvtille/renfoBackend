/**
 * Modèle de domaine Topic — sujet de débat rédigé par un content manager.
 */
export class TopicModel {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly createdById: string,
    public readonly createdAt: Date,
  ) {}
}
