import { ContactModel } from '../../domain/contact.model';

export abstract class ContactRepositoryPort {
  abstract save(contact: Partial<ContactModel>): Promise<ContactModel>;
  abstract findByOwnerId(ownerId: string): Promise<ContactModel[]>;
  abstract findByOwnerAndContact(ownerId: string, contactId: string): Promise<ContactModel | null>;
  abstract delete(id: string): Promise<void>;
}

export const CONTACT_REPOSITORY = Symbol('CONTACT_REPOSITORY');
