import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicEntity } from './entities/topic.entity';
import { TopicModel } from '../domain/topic.model';
import { TopicRepositoryPort } from '../app/ports/topic.repository.port';

@Injectable()
export class TopicRepository implements TopicRepositoryPort {
  constructor(
    @InjectRepository(TopicEntity)
    private readonly repo: Repository<TopicEntity>,
  ) {}

  private toModel(e: TopicEntity): TopicModel {
    return new TopicModel(e.id, e.content, e.createdById, e.createdAt);
  }

  async findAll(): Promise<TopicModel[]> {
    return (await this.repo.find()).map((e) => this.toModel(e));
  }

  /**
   * Sélectionne un topic aléatoire en une seule requête atomique.
   *
   * FIX RC-6 (Phantom Read) : l'ancienne implémentation faisait d'abord
   * un COUNT puis un FIND avec OFFSET. Entre les deux requêtes, un topic
   * pouvait être supprimé, rendant l'offset invalide (lecture fantôme).
   * ORDER BY RANDOM() LIMIT 1 est atomique : une seule requête, pas de fenêtre.
   */
  async findRandom(): Promise<TopicModel | null> {
    const result = await this.repo
      .createQueryBuilder('topic')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
    return result ? this.toModel(result) : null;
  }

  async save(topic: Partial<TopicModel>): Promise<TopicModel> {
    const e = await this.repo.save(topic as Partial<TopicEntity>);
    return this.toModel(e);
  }
}
