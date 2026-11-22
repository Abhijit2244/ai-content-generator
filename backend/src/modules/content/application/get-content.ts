import { IContentRepository, ContentEntity } from '../domain/content.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class GetContentByIdUseCase {
  constructor(private readonly contentRepository: IContentRepository) {}

  async execute(id: string, userId: string): Promise<ContentEntity> {
    const item = await this.contentRepository.findByIdAndUserId(id, userId);
    if (!item) {
      throw new NotFoundError('Content document not found');
    }
    return item;
  }
}
