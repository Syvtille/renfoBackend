import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactEntity } from './entities/contact.entity';
import { ContactModel } from '../domain/contact.model';
import { ContactRepositoryPort } from '../app/ports/contact.repository.port';

@Injectable()
export class ContactRepository implements ContactRepositoryPort {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly repo: Repository<ContactEntity>,
  ) {}

  private toModel(e: ContactEntity): ContactModel {
    return new ContactModel(e.id, e.ownerId, e.contactId, e.contactUsername, e.addedAt);
  }

  async save(contact: Partial<ContactModel>): Promise<ContactModel> {
    const e = await this.repo.save(contact as Partial<ContactEntity>);
    return this.toModel(e);
  }

  async findByOwnerId(ownerId: string): Promise<ContactModel[]> {
    const entities = await this.repo.find({
      where: { ownerId },
      order: { addedAt: 'DESC' },
    });
    return entities.map((e) => this.toModel(e));
  }

  async findByOwnerAndContact(ownerId: string, contactId: string): Promise<ContactModel | null> {
    const e = await this.repo.findOne({ where: { ownerId, contactId } });
    return e ? this.toModel(e) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
