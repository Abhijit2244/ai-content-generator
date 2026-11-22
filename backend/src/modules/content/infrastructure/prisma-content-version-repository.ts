import { PrismaClient } from '@prisma/client';
import {
  IContentVersionRepository,
  ContentVersionEntity,
  ChangeType,
} from '../domain/content.js';

export class PrismaContentVersionRepository implements IContentVersionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createVersion(data: {
    contentId: string;
    versionNumber: number;
    contentSnapshot: string;
    changeType: ChangeType;
  }): Promise<ContentVersionEntity> {
    const record = await this.prisma.contentVersion.create({
      data: {
        contentId: data.contentId,
        versionNumber: data.versionNumber,
        contentSnapshot: data.contentSnapshot,
        changeType: data.changeType,
      },
    });
    return record;
  }

  async findLatestVersionNumber(contentId: string): Promise<number> {
    const latest = await this.prisma.contentVersion.findFirst({
      where: { contentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    return latest?.versionNumber ?? 0;
  }

  async findVersionsByContentId(contentId: string): Promise<ContentVersionEntity[]> {
    return this.prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async findByVersionIdAndContentId(
    versionId: string,
    contentId: string
  ): Promise<ContentVersionEntity | null> {
    return this.prisma.contentVersion.findFirst({
      where: {
        id: versionId,
        contentId,
      },
    });
  }
}
