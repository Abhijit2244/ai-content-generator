import {
  IContentRepository,
  IContentVersionRepository,
  ContentVersionEntity,
} from '../domain/content.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class ListVersionsUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly versionRepository: IContentVersionRepository
  ) {}

  async execute(contentId: string, userId: string): Promise<ContentVersionEntity[]> {
    const content = await this.contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) {
      throw new NotFoundError('Content document not found');
    }

    return this.versionRepository.findVersionsByContentId(contentId);
  }
}
