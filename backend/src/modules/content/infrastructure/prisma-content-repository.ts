import { PrismaClient, Prisma } from '@prisma/client';
import {
  IContentRepository,
  ContentEntity,
  ContentFilterOptions,
  PaginatedResult,
} from '../domain/content.js';

export class PrismaContentRepository implements IContentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    userId: string;
    title: string;
    content: string;
    contentType: string;
    tone: string;
    length: string;
  }): Promise<ContentEntity> {
    const record = await this.prisma.content.create({
      data: {
        userId: data.userId,
        title: data.title.trim(),
        content: data.content,
        contentType: data.contentType,
        tone: data.tone,
        length: data.length,
      },
    });
    return record;
  }

  async findById(id: string): Promise<ContentEntity | null> {
    return this.prisma.content.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ContentEntity | null> {
    return this.prisma.content.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async findManyByUserId(
    userId: string,
    options: ContentFilterOptions
  ): Promise<PaginatedResult<ContentEntity>> {
    const { search, contentType, sortBy = 'updatedAt', sortOrder = 'desc', page, limit } = options;

    const where: Prisma.ContentWhereInput = {
      userId,
      ...(contentType ? { contentType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.content.count({ where }),
      this.prisma.content.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; content?: string }
  ): Promise<ContentEntity> {
    const record = await this.prisma.content.update({
      where: {
        id,
        userId, // ensure ownership in update query
      },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
      },
    });
    return record;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.content.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }
}
