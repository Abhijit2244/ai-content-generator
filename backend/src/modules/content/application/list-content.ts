import {
  IContentRepository,
  ContentEntity,
  ContentFilterOptions,
  PaginatedResult,
} from '../domain/content.js';

export class ListContentUseCase {
  constructor(private readonly contentRepository: IContentRepository) {}

  async execute(
    userId: string,
    options: ContentFilterOptions
  ): Promise<PaginatedResult<ContentEntity>> {
    return this.contentRepository.findManyByUserId(userId, options);
  }
}
