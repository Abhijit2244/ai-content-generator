export type ContentType =
  | 'blog'
  | 'social_linkedin'
  | 'social_instagram'
  | 'social_x'
  | 'email'
  | 'marketing'
  | 'product_description'
  | 'study_notes'
  | 'report'
  | 'creative_writing';

export type Tone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'persuasive'
  | 'informative'
  | 'creative'
  | 'humorous'
  | 'academic';

export type ContentLength = 'short' | 'medium' | 'long';

export type ChangeType = 'generated' | 'refined' | 'edited' | 'selected';

export interface ContentEntity {
  id: string;
  userId: string;
  title: string;
  content: string;
  contentType: string;
  tone: string;
  length: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentVersionEntity {
  id: string;
  contentId: string;
  versionNumber: number;
  contentSnapshot: string;
  changeType: string;
  createdAt: Date;
}

export interface ContentFilterOptions {
  search?: string;
  contentType?: string;
  sortBy?: 'updatedAt' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IContentRepository {
  create(data: {
    userId: string;
    title: string;
    content: string;
    contentType: string;
    tone: string;
    length: string;
  }): Promise<ContentEntity>;

  findById(id: string): Promise<ContentEntity | null>;
  findByIdAndUserId(id: string, userId: string): Promise<ContentEntity | null>;

  findManyByUserId(
    userId: string,
    options: ContentFilterOptions
  ): Promise<PaginatedResult<ContentEntity>>;

  update(
    id: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
    }
  ): Promise<ContentEntity>;

  delete(id: string, userId: string): Promise<void>;
}

export interface IContentVersionRepository {
  createVersion(data: {
    contentId: string;
    versionNumber: number;
    contentSnapshot: string;
    changeType: ChangeType;
  }): Promise<ContentVersionEntity>;

  findLatestVersionNumber(contentId: string): Promise<number>;
  findVersionsByContentId(contentId: string): Promise<ContentVersionEntity[]>;
  findByVersionIdAndContentId(
    versionId: string,
    contentId: string
  ): Promise<ContentVersionEntity | null>;
}
