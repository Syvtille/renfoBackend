import { Inject, Injectable } from '@nestjs/common';
import { TOPIC_REPOSITORY, TopicRepositoryPort } from '../ports/topic.repository.port';

@Injectable()
export class CreateTopicUseCase {
  constructor(
    @Inject(TOPIC_REPOSITORY) private readonly topicRepo: TopicRepositoryPort,
  ) {}

  async execute(content: string, createdById: string) {
    return this.topicRepo.save({ content, createdById } as any);
  }
}
