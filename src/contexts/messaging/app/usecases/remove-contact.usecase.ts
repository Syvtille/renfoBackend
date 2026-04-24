import { Inject, Injectable } from '@nestjs/common';
import {
  CONTACT_REPOSITORY,
  ContactRepositoryPort,
} from '../ports/contact.repository.port';

@Injectable()
export class RemoveContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepositoryPort,
  ) {}

  async execute(contactRecordId: string) {
    await this.contactRepo.delete(contactRecordId);
  }
}
