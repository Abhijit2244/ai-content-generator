import { PrismaClient } from '@prisma/client';
import {
  IAiServiceClient,
  IGenerationLogRepository,
} from '../domain/generation.js';
import { GenerateContentInput } from '../../content/presentation/content-dto.js';
import { ContentEntity } from '../../content/domain/content.js';
import { sanitizeString, sanitizeStringArray } from '../../../shared/utils/sanitizer.js';

export interface GenerateContentResult {
  content: ContentEntity & { version: number };
  meta: {
    model: string;
    generationTimeMs: number;
    usage?: {
      inputTokens?: number | null;
      outputTokens?: number | null;
    };
  };
}

export class GenerateContentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiClient: IAiServiceClient,
    private readonly logRepository: IGenerationLogRepository
  ) {}

  async execute(
    userId: string,
    input: GenerateContentInput,
    requestId?: string
  ): Promise<GenerateContentResult> {
    const startTime = Date.now();
    let modelName = 'gemini-1.5-flash';
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    // Sanitize untrusted input parameters to neutralize XSS & injection vectors
    const sanitizedTitle = sanitizeString(input.title).trim();
    const sanitizedTargetAudience = input.targetAudience ? sanitizeString(input.targetAudience).trim() : '';
    const sanitizedKeywords = sanitizeStringArray(input.keywords || []);
    const sanitizedContext = input.context ? sanitizeString(input.context).trim() : '';
    const sanitizedReferenceText = input.referenceText ? sanitizeString(input.referenceText).trim() : '';

    try {
      const aiResponse = await this.aiClient.generate(
        {
          title: sanitizedTitle,
          contentType: input.contentType,
          tone: input.tone,
          length: input.length,
          targetAudience: sanitizedTargetAudience,
          keywords: sanitizedKeywords,
          context: sanitizedContext,
          referenceText: sanitizedReferenceText,
        },
        requestId
      );

      const latencyMs = Date.now() - startTime;
      modelName = aiResponse.model || modelName;
      inputTokens = aiResponse.usage?.inputTokens ?? null;
      outputTokens = aiResponse.usage?.outputTokens ?? null;

      // Sanitize AI-generated output to neutralize indirect prompt injection & stored XSS
      const cleanGeneratedTitle = sanitizeString(aiResponse.title || sanitizedTitle).trim();
      const cleanGeneratedContent = sanitizeString(aiResponse.content);

      // Use database transaction to save content and initial version
      const result = await this.prisma.$transaction(async (tx) => {
        const contentRecord = await tx.content.create({
          data: {
            userId,
            title: cleanGeneratedTitle,
            content: cleanGeneratedContent,
            contentType: input.contentType,
            tone: input.tone,
            length: input.length,
          },
        });

        await tx.contentVersion.create({
          data: {
            contentId: contentRecord.id,
            versionNumber: 1,
            contentSnapshot: cleanGeneratedContent,
            changeType: 'generated',
          },
        });

        return contentRecord;
      });

      // Log successful generation
      await this.logRepository.createLog({
        userId,
        contentId: result.id,
        operation: 'generate',
        modelName,
        inputTokens,
        outputTokens,
        latencyMs,
        status: 'success',
      });

      return {
        content: {
          ...result,
          version: 1,
        },
        meta: {
          model: modelName,
          generationTimeMs: latencyMs,
          usage: {
            inputTokens,
            outputTokens,
          },
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorCode = (err as { code?: string })?.code || 'GENERATION_FAILED';

      await this.logRepository.createLog({
        userId,
        operation: 'generate',
        modelName,
        latencyMs,
        status: 'failure',
        errorCode,
      });

      throw err;
    }
  }
}
