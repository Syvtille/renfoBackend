import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  CONTACT_REPOSITORY,
  ContactRepositoryPort,
} from '../ports/contact.repository.port';

@Injectable()
export class AddContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepositoryPort,
  ) {}

  async execute(ownerId: string, contactId: string, contactUsername: string) {
    const existing = await this.contactRepo.findByOwnerAndContact(ownerId, contactId);
    if (existing) {
      throw new ConflictException('Ce contact existe déjà');
    }
    return this.contactRepo.save({ ownerId, contactId, contactUsername });
  }
}
