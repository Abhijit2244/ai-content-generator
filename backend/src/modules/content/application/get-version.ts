import {
  IContentRepository,
  IContentVersionRepository,
  ContentVersionEntity,
} from '../domain/content.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class GetVersionByIdUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly versionRepository: IContentVersionRepository
  ) {}

  async execute(
    versionId: string,
    contentId: string,
    userId: string
  ): Promise<ContentVersionEntity> {
    const content = await this.contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) {
      throw new NotFoundError('Content document not found');
    }

    const version = await this.versionRepository.findByVersionIdAndContentId(
      versionId,
      contentId
    );
    if (!version) {
      throw new NotFoundError('Version snapshot not found');
    }

    return version;
  }
}
