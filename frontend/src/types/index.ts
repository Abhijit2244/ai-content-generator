export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

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

export interface ContentItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  contentType: ContentType;
  tone: Tone;
  length: ContentLength;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  contentSnapshot: string;
  changeType: 'generated' | 'refined' | 'edited' | 'selected';
  createdAt: string;
}

export interface VariationItem {
  index: number;
  content: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
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
