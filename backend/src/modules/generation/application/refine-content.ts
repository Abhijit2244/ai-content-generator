import { PrismaClient } from '@prisma/client';
import {
  IAiServiceClient,
  IGenerationLogRepository,
} from '../domain/generation.js';
import { RefineContentInput } from '../../content/presentation/content-dto.js';
import { ContentEntity } from '../../content/domain/content.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import { sanitizeString } from '../../../shared/utils/sanitizer.js';

export interface RefineContentResult {
  content: ContentEntity & { version: number; changeType: string };
  meta: {
    model: string;
    generationTimeMs: number;
  };
}

export class RefineContentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiClient: IAiServiceClient,
    private readonly logRepository: IGenerationLogRepository
  ) {}

  async execute(
    contentId: string,
    userId: string,
    input: RefineContentInput,
    requestId?: string
  ): Promise<RefineContentResult> {
    const existing = await this.prisma.content.findFirst({
      where: {
        id: contentId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Content document not found');
    }

    const textToRefine = sanitizeString(input.currentContent || existing.content);
    const sanitizedInstruction = input.instruction ? sanitizeString(input.instruction).trim() : undefined;
    const sanitizedSelectedText = input.selectedText ? sanitizeString(input.selectedText).trim() : undefined;
    const startTime = Date.now();
    let modelName = 'gemini-1.5-flash';

    try {
      const aiResponse = await this.aiClient.refine(
        {
          content: textToRefine,
          action: input.action,
          instruction: sanitizedInstruction,
          scope: input.scope,
          selectedText: sanitizedSelectedText,
        },
        requestId
      );

      const latencyMs = Date.now() - startTime;
      modelName = aiResponse.model || modelName;
      const cleanRefinedContent = sanitizeString(aiResponse.content);

      // In transaction, save new version and update content
      const result = await this.prisma.$transaction(async (tx) => {
        const latestVersion = await tx.contentVersion.findFirst({
          where: { contentId },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        });

        const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

        await tx.contentVersion.create({
          data: {
            contentId,
            versionNumber: nextVersionNumber,
            contentSnapshot: cleanRefinedContent,
            changeType: 'refined',
          },
        });

        const updated = await tx.content.update({
          where: { id: contentId },
          data: {
            content: cleanRefinedContent,
          },
        });

        return {
          ...updated,
          version: nextVersionNumber,
          changeType: 'refined',
        };
      });

      await this.logRepository.createLog({
        userId,
        contentId,
        operation: 'refine',
        modelName,
        latencyMs,
        status: 'success',
      });

      return {
        content: result,
        meta: {
          model: modelName,
          generationTimeMs: latencyMs,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorCode = (err as { code?: string })?.code || 'REFINEMENT_FAILED';

      await this.logRepository.createLog({
        userId,
        contentId,
        operation: 'refine',
        modelName,
        latencyMs,
        status: 'failure',
        errorCode,
      });

      throw err;
    }
  }
}
