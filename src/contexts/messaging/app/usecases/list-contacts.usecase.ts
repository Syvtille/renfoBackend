import { Inject, Injectable } from '@nestjs/common';
import {
  CONTACT_REPOSITORY,
  ContactRepositoryPort,
} from '../ports/contact.repository.port';

@Injectable()
export class ListContactsUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepositoryPort,
  ) {}

  async execute(ownerId: string) {
    return this.contactRepo.findByOwnerId(ownerId);
  }
}
