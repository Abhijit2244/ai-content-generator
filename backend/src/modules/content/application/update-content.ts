import {
  IContentRepository,
  IContentVersionRepository,
  ContentEntity,
} from '../domain/content.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import { sanitizeString } from '../../../shared/utils/sanitizer.js';

export class UpdateContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly versionRepository: IContentVersionRepository
  ) {}

  async execute(
    id: string,
    userId: string,
    input: { title?: string; content?: string }
  ): Promise<ContentEntity> {
    const existing = await this.contentRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundError('Content document not found');
    }

    const sanitizedInput: { title?: string; content?: string } = {};
    if (input.title !== undefined) {
      sanitizedInput.title = sanitizeString(input.title).trim();
    }
    if (input.content !== undefined) {
      sanitizedInput.content = sanitizeString(input.content);
    }

    const previousContent = existing.content;
    const updated = await this.contentRepository.update(id, userId, sanitizedInput);

    // If content text was modified, snapshot a new version
    if (sanitizedInput.content !== undefined && sanitizedInput.content !== previousContent) {
      const latestVersionNumber = await this.versionRepository.findLatestVersionNumber(id);
      await this.versionRepository.createVersion({
        contentId: id,
        versionNumber: latestVersionNumber + 1,
        contentSnapshot: sanitizedInput.content,
        changeType: 'edited',
      });
    }

    return updated;
  }
}
