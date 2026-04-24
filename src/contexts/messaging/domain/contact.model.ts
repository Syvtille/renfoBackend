/**
 * Modèle de domaine Contact — relation de contact entre utilisateurs.
 */
export class ContactModel {
  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly contactId: string,
    public readonly contactUsername: string,
    public readonly addedAt: Date,
  ) {}
}
