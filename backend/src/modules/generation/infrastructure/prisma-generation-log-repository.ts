import { PrismaClient } from '@prisma/client';
import { IGenerationLogRepository, CreateLogData } from '../domain/generation.js';

export class PrismaGenerationLogRepository implements IGenerationLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createLog(data: CreateLogData): Promise<void> {
    try {
      await this.prisma.generationLog.create({
        data: {
          userId: data.userId,
          contentId: data.contentId ?? null,
          operation: data.operation,
          modelName: data.modelName,
          inputTokens: data.inputTokens ?? null,
          outputTokens: data.outputTokens ?? null,
          latencyMs: data.latencyMs,
          status: data.status,
          errorCode: data.errorCode ?? null,
        },
      });
    } catch (err) {
      // Logging should never throw and block the user flow
      console.error('Failed to persist generation log:', err);
    }
  }
}
