import { describe, it, expect, beforeEach } from 'vitest';
import {
  IContentRepository,
  IContentVersionRepository,
  ContentEntity,
  ContentVersionEntity,
  ContentFilterOptions,
  PaginatedResult,
} from '../src/modules/content/domain/content.js';
import { GetContentByIdUseCase } from '../src/modules/content/application/get-content.js';
import { UpdateContentUseCase } from '../src/modules/content/application/update-content.js';
import { DeleteContentUseCase } from '../src/modules/content/application/delete-content.js';
import { ListVersionsUseCase } from '../src/modules/content/application/list-versions.js';
import { NotFoundError } from '../src/shared/errors/app-error.js';

class InMemoryContentRepository implements IContentRepository {
  public items: ContentEntity[] = [];

  async create(data: {
    userId: string;
    title: string;
    content: string;
    contentType: string;
    tone: string;
    length: string;
  }): Promise<ContentEntity> {
    const item: ContentEntity = {
      id: `content-${this.items.length + 1}`,
      userId: data.userId,
      title: data.title,
      content: data.content,
      contentType: data.contentType,
      tone: data.tone,
      length: data.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async findById(id: string): Promise<ContentEntity | null> {
    return this.items.find((i) => i.id === id) || null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ContentEntity | null> {
    return this.items.find((i) => i.id === id && i.userId === userId) || null;
  }

  async findManyByUserId(
    userId: string,
    options: ContentFilterOptions
  ): Promise<PaginatedResult<ContentEntity>> {
    let filtered = this.items.filter((i) => i.userId === userId);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q)
      );
    }
    return {
      items: filtered,
      pagination: {
        total: filtered.length,
        page: options.page,
        limit: options.limit,
        totalPages: 1,
      },
    };
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; content?: string }
  ): Promise<ContentEntity> {
    const item = await this.findByIdAndUserId(id, userId);
    if (!item) throw new NotFoundError('Content document not found');
    if (data.title !== undefined) item.title = data.title;
    if (data.content !== undefined) item.content = data.content;
    item.updatedAt = new Date();
    return item;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.items = this.items.filter((i) => !(i.id === id && i.userId === userId));
  }
}

class InMemoryVersionRepository implements IContentVersionRepository {
  public versions: ContentVersionEntity[] = [];

  async createVersion(data: {
    contentId: string;
    versionNumber: number;
    contentSnapshot: string;
    changeType: 'generated' | 'refined' | 'edited' | 'selected';
  }): Promise<ContentVersionEntity> {
    const version: ContentVersionEntity = {
      id: `ver-${this.versions.length + 1}`,
      contentId: data.contentId,
      versionNumber: data.versionNumber,
      contentSnapshot: data.contentSnapshot,
      changeType: data.changeType,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return version;
  }

  async findLatestVersionNumber(contentId: string): Promise<number> {
    const list = this.versions.filter((v) => v.contentId === contentId);
    return list.reduce((max, v) => (v.versionNumber > max ? v.versionNumber : max), 0);
  }

  async findVersionsByContentId(contentId: string): Promise<ContentVersionEntity[]> {
    return this.versions.filter((v) => v.contentId === contentId);
  }

  async findByVersionIdAndContentId(
    versionId: string,
    contentId: string
  ): Promise<ContentVersionEntity | null> {
    return (
      this.versions.find((v) => v.id === versionId && v.contentId === contentId) || null
    );
  }
}

describe('Content Ownership & Lifecycle', () => {
  let contentRepo: InMemoryContentRepository;
  let versionRepo: InMemoryVersionRepository;
  let getByIdUseCase: GetContentByIdUseCase;
  let updateUseCase: UpdateContentUseCase;
  let deleteUseCase: DeleteContentUseCase;
  let listVersionsUseCase: ListVersionsUseCase;

  const userA = 'user-a-id';
  const userB = 'user-b-id';

  beforeEach(() => {
    contentRepo = new InMemoryContentRepository();
    versionRepo = new InMemoryVersionRepository();
    getByIdUseCase = new GetContentByIdUseCase(contentRepo);
    updateUseCase = new UpdateContentUseCase(contentRepo, versionRepo);
    deleteUseCase = new DeleteContentUseCase(contentRepo);
    listVersionsUseCase = new ListVersionsUseCase(contentRepo, versionRepo);
  });

  it('allows owner to retrieve and update content, creating a version snapshot', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'Original Title',
      content: 'Initial text content',
      contentType: 'blog',
      tone: 'informative',
      length: 'medium',
    });

    await versionRepo.createVersion({
      contentId: item.id,
      versionNumber: 1,
      contentSnapshot: item.content,
      changeType: 'generated',
    });

    const retrieved = await getByIdUseCase.execute(item.id, userA);
    expect(retrieved.title).toBe('Original Title');

    const updated = await updateUseCase.execute(item.id, userA, {
      title: 'Updated Title',
      content: 'Modified text content',
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.content).toBe('Modified text content');

    const versions = await listVersionsUseCase.execute(item.id, userA);
    expect(versions).toHaveLength(2);
    expect(versions[1].changeType).toBe('edited');
    expect(versions[1].contentSnapshot).toBe('Modified text content');
  });

  it('STRICT PRIVACY: prevents User B from retrieving, updating, or deleting User A content', async () => {
    const itemA = await contentRepo.create({
      userId: userA,
      title: 'Secret Notes for User A',
      content: 'Confidential thoughts',
      contentType: 'study_notes',
      tone: 'academic',
      length: 'short',
    });

    // User B tries to read User A's content
    await expect(getByIdUseCase.execute(itemA.id, userB)).rejects.toThrow(NotFoundError);

    // User B tries to update User A's content
    await expect(
      updateUseCase.execute(itemA.id, userB, { title: 'Hacked Title' })
    ).rejects.toThrow(NotFoundError);

    // User B tries to delete User A's content
    await expect(deleteUseCase.execute(itemA.id, userB)).rejects.toThrow(NotFoundError);

    // User B tries to list versions of User A's content
    await expect(listVersionsUseCase.execute(itemA.id, userB)).rejects.toThrow(NotFoundError);
  });
});
