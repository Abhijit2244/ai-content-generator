import { describe, it, expect, beforeEach } from 'vitest';
import {
  IContentRepository,
  IContentVersionRepository,
  ContentEntity,
  ContentVersionEntity,
  ContentFilterOptions,
  PaginatedResult,
} from '../../src/modules/content/domain/content.js';
import { ListContentUseCase } from '../../src/modules/content/application/list-content.js';
import { GetContentByIdUseCase } from '../../src/modules/content/application/get-content.js';
import { UpdateContentUseCase } from '../../src/modules/content/application/update-content.js';
import { DeleteContentUseCase } from '../../src/modules/content/application/delete-content.js';
import { ListVersionsUseCase } from '../../src/modules/content/application/list-versions.js';
import { GetVersionByIdUseCase } from '../../src/modules/content/application/get-version.js';
import { NotFoundError } from '../../src/shared/errors/app-error.js';

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
    if (options.contentType) {
      filtered = filtered.filter((i) => i.contentType === options.contentType);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q)
      );
    }

    const start = (options.page - 1) * options.limit;
    const paginatedItems = filtered.slice(start, start + options.limit);

    return {
      items: paginatedItems,
      pagination: {
        total: filtered.length,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(filtered.length / options.limit) || 1,
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
    return this.versions
      .filter((v) => v.contentId === contentId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
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

describe('Content Management Unit Tests (In-Memory Isolation)', () => {
  let contentRepo: InMemoryContentRepository;
  let versionRepo: InMemoryVersionRepository;
  let listUseCase: ListContentUseCase;
  let getByIdUseCase: GetContentByIdUseCase;
  let updateUseCase: UpdateContentUseCase;
  let deleteUseCase: DeleteContentUseCase;
  let listVersionsUseCase: ListVersionsUseCase;
  let getVersionByIdUseCase: GetVersionByIdUseCase;

  const userA = 'user-a-id';
  const userB = 'user-b-id';

  beforeEach(() => {
    contentRepo = new InMemoryContentRepository();
    versionRepo = new InMemoryVersionRepository();
    listUseCase = new ListContentUseCase(contentRepo);
    getByIdUseCase = new GetContentByIdUseCase(contentRepo);
    updateUseCase = new UpdateContentUseCase(contentRepo, versionRepo);
    deleteUseCase = new DeleteContentUseCase(contentRepo);
    listVersionsUseCase = new ListVersionsUseCase(contentRepo, versionRepo);
    getVersionByIdUseCase = new GetVersionByIdUseCase(contentRepo, versionRepo);
  });

  it('lists content filtered by search query matching title', async () => {
    await contentRepo.create({
      userId: userA,
      title: 'Guide to Clean Architecture',
      content: 'Body content 1',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });
    await contentRepo.create({
      userId: userA,
      title: 'Top 10 Productivity Tips',
      content: 'Body content 2',
      contentType: 'social_linkedin',
      tone: 'casual',
      length: 'short',
    });

    const res = await listUseCase.execute(userA, {
      search: 'Clean Architecture',
      page: 1,
      limit: 10,
    });

    expect(res.items).toHaveLength(1);
    expect(res.items[0].title).toBe('Guide to Clean Architecture');
  });

  it('lists content filtered by content type format', async () => {
    await contentRepo.create({
      userId: userA,
      title: 'Item 1',
      content: 'Text',
      contentType: 'email',
      tone: 'professional',
      length: 'short',
    });
    await contentRepo.create({
      userId: userA,
      title: 'Item 2',
      content: 'Text',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    const res = await listUseCase.execute(userA, {
      contentType: 'email',
      page: 1,
      limit: 10,
    });

    expect(res.items).toHaveLength(1);
    expect(res.items[0].contentType).toBe('email');
  });

  it('calculates correct pagination metadata for large document collections', async () => {
    for (let i = 1; i <= 7; i++) {
      await contentRepo.create({
        userId: userA,
        title: `Doc ${i}`,
        content: `Content ${i}`,
        contentType: 'blog',
        tone: 'informative',
        length: 'short',
      });
    }

    const page1 = await listUseCase.execute(userA, { page: 1, limit: 3 });
    expect(page1.items).toHaveLength(3);
    expect(page1.pagination.total).toBe(7);
    expect(page1.pagination.totalPages).toBe(3);

    const page3 = await listUseCase.execute(userA, { page: 3, limit: 3 });
    expect(page3.items).toHaveLength(1);
  });

  it('updating title only preserves content and does not create unnecessary version snapshots', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'Initial Title',
      content: 'Unchanged body text',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    await versionRepo.createVersion({
      contentId: item.id,
      versionNumber: 1,
      contentSnapshot: item.content,
      changeType: 'generated',
    });

    await updateUseCase.execute(item.id, userA, { title: 'Renamed Title Only' });

    const versions = await listVersionsUseCase.execute(item.id, userA);
    expect(versions).toHaveLength(1); // Still only version 1
  });

  it('updating content text creates an edited version snapshot', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'Document',
      content: 'Original draft',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    await versionRepo.createVersion({
      contentId: item.id,
      versionNumber: 1,
      contentSnapshot: item.content,
      changeType: 'generated',
    });

    await updateUseCase.execute(item.id, userA, { content: 'Revised second draft' });

    const versions = await listVersionsUseCase.execute(item.id, userA);
    expect(versions).toHaveLength(2);
    expect(versions[0].versionNumber).toBe(2);
    expect(versions[0].changeType).toBe('edited');
    expect(versions[0].contentSnapshot).toBe('Revised second draft');
  });

  it('retrieves specific historical version by version ID', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'Document',
      content: 'Original',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    const v1 = await versionRepo.createVersion({
      contentId: item.id,
      versionNumber: 1,
      contentSnapshot: 'Original',
      changeType: 'generated',
    });

    const foundVersion = await getVersionByIdUseCase.execute(v1.id, item.id, userA);
    expect(foundVersion.versionNumber).toBe(1);
    expect(foundVersion.contentSnapshot).toBe('Original');
  });

  it('deletes content and verifies removal', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'To Be Deleted',
      content: 'Some text',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    await deleteUseCase.execute(item.id, userA);
    await expect(getByIdUseCase.execute(item.id, userA)).rejects.toThrow(NotFoundError);
  });

  it('TENANT PRIVACY: User B is forbidden from reading, updating, deleting, or listing versions of User A document', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'User A Secret File',
      content: 'Confidential',
      contentType: 'report',
      tone: 'academic',
      length: 'short',
    });

    await expect(getByIdUseCase.execute(item.id, userB)).rejects.toThrow(NotFoundError);
    await expect(updateUseCase.execute(item.id, userB, { title: 'Hacked' })).rejects.toThrow(
      NotFoundError
    );
    await expect(deleteUseCase.execute(item.id, userB)).rejects.toThrow(NotFoundError);
    await expect(listVersionsUseCase.execute(item.id, userB)).rejects.toThrow(NotFoundError);
  });

  it('sequential content edits increment version numbers accurately (v1, v2, v3)', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'Multi-Version Post',
      content: 'Version 1 body',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    await versionRepo.createVersion({
      contentId: item.id,
      versionNumber: 1,
      contentSnapshot: 'Version 1 body',
      changeType: 'generated',
    });

    await updateUseCase.execute(item.id, userA, { content: 'Version 2 body' });
    await updateUseCase.execute(item.id, userA, { content: 'Version 3 body' });

    const versions = await listVersionsUseCase.execute(item.id, userA);
    expect(versions).toHaveLength(3);
    expect(versions[0].versionNumber).toBe(3);
    expect(versions[0].contentSnapshot).toBe('Version 3 body');
    expect(versions[1].versionNumber).toBe(2);
    expect(versions[1].contentSnapshot).toBe('Version 2 body');
    expect(versions[2].versionNumber).toBe(1);
    expect(versions[2].contentSnapshot).toBe('Version 1 body');
  });

  it('pagination returns empty items array when requested page exceeds total pages', async () => {
    await contentRepo.create({
      userId: userA,
      title: 'Doc 1',
      content: 'Body 1',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    const result = await listUseCase.execute(userA, { page: 99, limit: 10 });
    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(99);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('throws NotFoundError when attempting to retrieve a non-existent version ID', async () => {
    const item = await contentRepo.create({
      userId: userA,
      title: 'Doc With No Versions',
      content: 'Body',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    await expect(
      getVersionByIdUseCase.execute('non-existent-version-id', item.id, userA)
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when deleting non-existent content', async () => {
    await expect(deleteUseCase.execute('ghost-id', userA)).rejects.toThrow(NotFoundError);
  });
});
