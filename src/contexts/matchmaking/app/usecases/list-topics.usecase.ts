import { Inject, Injectable } from '@nestjs/common';
import { TOPIC_REPOSITORY, TopicRepositoryPort } from '../ports/topic.repository.port';

@Injectable()
export class ListTopicsUseCase {
  constructor(
    @Inject(TOPIC_REPOSITORY) private readonly topicRepo: TopicRepositoryPort,
  ) {}

  async execute() {
    return this.topicRepo.findAll();
  }
}
