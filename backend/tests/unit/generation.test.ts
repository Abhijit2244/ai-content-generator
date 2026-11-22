import { describe, it, expect, vi } from 'vitest';
import { GenerateContentUseCase } from '../../src/modules/generation/application/generate-content.js';
import { RefineContentUseCase } from '../../src/modules/generation/application/refine-content.js';
import { CreateVariationsUseCase } from '../../src/modules/generation/application/create-variations.js';
import {
  IAiServiceClient,
  IGenerationLogRepository,
  AiGenerateInput,
  AiGenerateOutput,
  AiRefineInput,
  AiRefineOutput,
  AiVariationsInput,
  AiVariationsOutput,
} from '../../src/modules/generation/domain/generation.js';
import { AiProviderError, NotFoundError } from '../../src/shared/errors/app-error.js';

class MockAiServiceClient implements IAiServiceClient {
  public failNext = false;

  async generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    if (this.failNext) {
      throw new AiProviderError('Gemini is unavailable', 'AI_PROVIDER_TIMEOUT');
    }
    return {
      title: `Generated: ${input.title}`,
      content: 'This is high-quality generated content from mock AI.',
      model: 'gemini-3.5-flash',
      usage: { inputTokens: 50, outputTokens: 200 },
    };
  }

  async refine(input: AiRefineInput): Promise<AiRefineOutput> {
    if (this.failNext) {
      throw new AiProviderError('Refinement failed', 'AI_PROVIDER_ERROR');
    }
    return {
      content: `Refined: ${input.content} [action: ${input.action}]`,
      action: input.action,
      model: 'gemini-3.5-flash',
    };
  }

  async createVariations(input: AiVariationsInput): Promise<AiVariationsOutput> {
    return {
      variations: [
        { index: 1, content: 'Option 1 text' },
        { index: 2, content: 'Option 2 text' },
        { index: 3, content: 'Option 3 text' },
      ],
      model: 'gemini-3.5-flash',
    };
  }
}

class MockLogRepository implements IGenerationLogRepository {
  public logs: any[] = [];
  async createLog(data: any): Promise<void> {
    this.logs.push(data);
  }
}

describe('Generation Use Cases (Unit Tests - No DB needed)', () => {
  it('should handle AI provider failure gracefully without corrupted records', async () => {
    const mockAi = new MockAiServiceClient();
    mockAi.failNext = true;
    const mockLog = new MockLogRepository();

    // Mock Prisma Transaction
    const mockPrisma: any = {
      $transaction: vi.fn(),
    };

    const useCase = new GenerateContentUseCase(mockPrisma, mockAi, mockLog);

    await expect(
      useCase.execute('user-1', {
        title: 'Failing Topic',
        contentType: 'blog',
        tone: 'informative',
        length: 'short',
      })
    ).rejects.toThrow(AiProviderError);

    // Verify transaction was never committed
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();

    // Verify error was safely logged
    expect(mockLog.logs).toHaveLength(1);
    expect(mockLog.logs[0].status).toBe('failure');
    expect(mockLog.logs[0].errorCode).toBe('AI_PROVIDER_TIMEOUT');
  });

  it('should generate variations and log operation', async () => {
    const mockAi = new MockAiServiceClient();
    const mockLog = new MockLogRepository();

    const mockPrisma: any = {
      content: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'content-1',
          userId: 'user-1',
          title: 'Existing Draft',
          content: 'Original draft text',
          contentType: 'blog',
          tone: 'informative',
        }),
      },
    };

    const useCase = new CreateVariationsUseCase(mockPrisma, mockAi, mockLog);
    const result = await useCase.execute('content-1', 'user-1', { count: 3 });

    expect(result.variations).toHaveLength(3);
    expect(mockLog.logs).toHaveLength(1);
    expect(mockLog.logs[0].operation).toBe('variations');
    expect(mockLog.logs[0].status).toBe('success');
  });

  it('should reject variation request if user does not own content', async () => {
    const mockAi = new MockAiServiceClient();
    const mockLog = new MockLogRepository();

    const mockPrisma: any = {
      content: {
        findFirst: vi.fn().mockResolvedValue(null), // not found / not owned
      },
    };

    const useCase = new CreateVariationsUseCase(mockPrisma, mockAi, mockLog);
    await expect(useCase.execute('content-secret', 'user-intruder', { count: 3 })).rejects.toThrow(
      NotFoundError
    );
  });

  it('GenerateContentUseCase should successfully create content, record version 1, and log operation', async () => {
    const mockAi = new MockAiServiceClient();
    const mockLog = new MockLogRepository();

    const mockContentRecord = {
      id: 'content-gen-1',
      userId: 'user-1',
      title: 'Generated: Clean Code',
      content: 'This is high-quality generated content from mock AI.',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPrisma: any = {
      $transaction: vi.fn().mockImplementation(async (callback) => {
        const tx = {
          content: {
            create: vi.fn().mockResolvedValue(mockContentRecord),
          },
          contentVersion: {
            create: vi.fn().mockResolvedValue({
              id: 'version-1',
              contentId: 'content-gen-1',
              versionNumber: 1,
              contentSnapshot: mockContentRecord.content,
              changeType: 'generated',
            }),
          },
        };
        return callback(tx);
      }),
    };

    const useCase = new GenerateContentUseCase(mockPrisma, mockAi, mockLog);
    const result = await useCase.execute('user-1', {
      title: 'Clean Code',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
    });

    expect(result.content.id).toBe('content-gen-1');
    expect(result.content.version).toBe(1);
    expect(result.meta.model).toBe('gemini-3.5-flash');
    expect(mockLog.logs).toHaveLength(1);
    expect(mockLog.logs[0].operation).toBe('generate');
    expect(mockLog.logs[0].status).toBe('success');
  });

  it('RefineContentUseCase should successfully refine content, update document, and record version snapshot', async () => {
    const mockAi = new MockAiServiceClient();
    const mockLog = new MockLogRepository();

    const existingDoc = {
      id: 'content-existing-1',
      userId: 'user-1',
      title: 'Draft Document',
      content: 'Rough initial draft.',
      contentType: 'blog',
      tone: 'informative',
      length: 'short',
      versions: [{ versionNumber: 1 }],
    };

    const updatedDoc = {
      ...existingDoc,
      content: 'Refined: Rough initial draft. [action: simplify]',
    };

    const mockPrisma: any = {
      content: {
        findFirst: vi.fn().mockResolvedValue(existingDoc),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        const tx = {
          contentVersion: {
            findFirst: vi.fn().mockResolvedValue({ versionNumber: 1 }),
            create: vi.fn().mockResolvedValue({
              id: 'version-2',
              contentId: 'content-existing-1',
              versionNumber: 2,
              contentSnapshot: updatedDoc.content,
              changeType: 'refined',
            }),
          },
          content: {
            update: vi.fn().mockResolvedValue(updatedDoc),
          },
        };
        return callback(tx);
      }),
    };

    const useCase = new RefineContentUseCase(mockPrisma, mockAi, mockLog);
    const result = await useCase.execute('content-existing-1', 'user-1', {
      action: 'simplify',
    });

    expect(result.content.version).toBe(2);
    expect(result.content.changeType).toBe('refined');
    expect(result.meta.model).toBe('gemini-3.5-flash');
    expect(mockLog.logs).toHaveLength(1);
    expect(mockLog.logs[0].operation).toBe('refine');
    expect(mockLog.logs[0].status).toBe('success');
  });

  it('RefineContentUseCase should reject refinement if content is not found or not owned by user', async () => {
    const mockAi = new MockAiServiceClient();
    const mockLog = new MockLogRepository();

    const mockPrisma: any = {
      content: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const useCase = new RefineContentUseCase(mockPrisma, mockAi, mockLog);
    await expect(
      useCase.execute('unknown-content-id', 'user-unauthorized', {
        action: 'improve_grammar',
      })
    ).rejects.toThrow(NotFoundError);
  });
});
