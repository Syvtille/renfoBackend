import { TopicModel } from '../../domain/topic.model.js';

export abstract class TopicRepositoryPort {
  abstract findAll(): Promise<TopicModel[]>;
  abstract findRandom(): Promise<TopicModel | null>;
  abstract save(topic: Partial<TopicModel>): Promise<TopicModel>;
}

export const TOPIC_REPOSITORY = Symbol('TOPIC_REPOSITORY');
