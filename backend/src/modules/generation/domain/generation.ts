import { ContentType, Tone, ContentLength } from '../../content/domain/content.js';

export interface AiGenerateInput {
  title: string;
  contentType: ContentType;
  tone: Tone;
  length: ContentLength;
  targetAudience?: string;
  keywords?: string[];
  context?: string;
  referenceText?: string;
}

export interface AiGenerateOutput {
  title: string;
  content: string;
  model: string;
  usage?: {
    inputTokens?: number | null;
    outputTokens?: number | null;
  };
}

export interface AiRefineInput {
  content: string;
  action: string;
  instruction?: string;
  scope?: 'full' | 'partial';
  selectedText?: string | null;
}

export interface AiRefineOutput {
  content: string;
  action: string;
  model: string;
}

export interface AiVariationsInput {
  title: string;
  content: string;
  contentType: string;
  tone: string;
  count: number;
}

export interface VariationItem {
  index: number;
  content: string;
}

export interface AiVariationsOutput {
  variations: VariationItem[];
  model: string;
}

export interface IAiServiceClient {
  generate(input: AiGenerateInput, requestId?: string): Promise<AiGenerateOutput>;
  refine(input: AiRefineInput, requestId?: string): Promise<AiRefineOutput>;
  createVariations(input: AiVariationsInput, requestId?: string): Promise<AiVariationsOutput>;
}

export interface CreateLogData {
  userId: string;
  contentId?: string | null;
  operation: 'generate' | 'refine' | 'variations';
  modelName: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs: number;
  status: 'success' | 'failure';
  errorCode?: string | null;
}

export interface IGenerationLogRepository {
  createLog(data: CreateLogData): Promise<void>;
}
