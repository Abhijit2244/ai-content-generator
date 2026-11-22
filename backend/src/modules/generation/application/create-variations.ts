import { PrismaClient } from '@prisma/client';
import {
  IAiServiceClient,
  IGenerationLogRepository,
  VariationItem,
} from '../domain/generation.js';
import { VariationsInput } from '../../content/presentation/content-dto.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export interface VariationsResult {
  variations: VariationItem[];
  meta: {
    model: string;
    generationTimeMs: number;
  };
}

export class CreateVariationsUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiClient: IAiServiceClient,
    private readonly logRepository: IGenerationLogRepository
  ) {}

  async execute(
    contentId: string,
    userId: string,
    input: VariationsInput,
    requestId?: string
  ): Promise<VariationsResult> {
    const existing = await this.prisma.content.findFirst({
      where: {
        id: contentId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Content document not found');
    }

    const currentText = input.currentContent || existing.content;
    const startTime = Date.now();
    let modelName = 'gemini-1.5-flash';

    try {
      const aiResponse = await this.aiClient.createVariations(
        {
          title: existing.title,
          content: currentText,
          contentType: existing.contentType,
          tone: existing.tone,
          count: input.count,
        },
        requestId
      );

      const latencyMs = Date.now() - startTime;
      modelName = aiResponse.model || modelName;

      await this.logRepository.createLog({
        userId,
        contentId,
        operation: 'variations',
        modelName,
        latencyMs,
        status: 'success',
      });

      return {
        variations: aiResponse.variations,
        meta: {
          model: modelName,
          generationTimeMs: latencyMs,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorCode = (err as { code?: string })?.code || 'VARIATIONS_FAILED';

      await this.logRepository.createLog({
        userId,
        contentId,
        operation: 'variations',
        modelName,
        latencyMs,
        status: 'failure',
        errorCode,
      });

      throw err;
    }
  }
}
