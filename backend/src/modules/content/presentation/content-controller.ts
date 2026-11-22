import { Request, Response, NextFunction } from 'express';
import { GenerateContentUseCase } from '../../generation/application/generate-content.js';
import { RefineContentUseCase } from '../../generation/application/refine-content.js';
import { CreateVariationsUseCase } from '../../generation/application/create-variations.js';
import { ListContentUseCase } from '../application/list-content.js';
import { GetContentByIdUseCase } from '../application/get-content.js';
import { UpdateContentUseCase } from '../application/update-content.js';
import { DeleteContentUseCase } from '../application/delete-content.js';
import { ListVersionsUseCase } from '../application/list-versions.js';
import { GetVersionByIdUseCase } from '../application/get-version.js';
import {
  generateContentSchema,
  updateContentSchema,
  listContentQuerySchema,
  refineContentSchema,
  variationsSchema,
} from './content-dto.js';
import { sendSuccess } from '../../../shared/http/response.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';

export class ContentController {
  constructor(
    private readonly generateUseCase: GenerateContentUseCase,
    private readonly refineUseCase: RefineContentUseCase,
    private readonly variationsUseCase: CreateVariationsUseCase,
    private readonly listUseCase: ListContentUseCase,
    private readonly getByIdUseCase: GetContentByIdUseCase,
    private readonly updateUseCase: UpdateContentUseCase,
    private readonly deleteUseCase: DeleteContentUseCase,
    private readonly listVersionsUseCase: ListVersionsUseCase,
    private readonly getVersionByIdUseCase: GetVersionByIdUseCase
  ) {}

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const validated = generateContentSchema.parse(req.body);
      const result = await this.generateUseCase.execute(userId, validated, req.requestId);
      sendSuccess(res, result.content, 201, result.meta);
    } catch (err) {
      next(err);
    }
  };

  refine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      const validated = refineContentSchema.parse(req.body);
      const result = await this.refineUseCase.execute(contentId, userId, validated, req.requestId);
      sendSuccess(res, result.content, 200, result.meta);
    } catch (err) {
      next(err);
    }
  };

  variations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      const validated = variationsSchema.parse(req.body);
      const result = await this.variationsUseCase.execute(contentId, userId, validated, req.requestId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const query = listContentQuerySchema.parse(req.query);
      const result = await this.listUseCase.execute(userId, query);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      const item = await this.getByIdUseCase.execute(contentId, userId);
      sendSuccess(res, item, 200);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      const validated = updateContentSchema.parse(req.body);
      const updated = await this.updateUseCase.execute(contentId, userId, validated);
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      await this.deleteUseCase.execute(contentId, userId);
      sendSuccess(res, { message: 'Content deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  };

  listVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      const versions = await this.listVersionsUseCase.execute(contentId, userId);
      sendSuccess(res, versions, 200);
    } catch (err) {
      next(err);
    }
  };

  getVersionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError();

      const contentId = String(req.params.id);
      const versionId = String(req.params.versionId);
      const version = await this.getVersionByIdUseCase.execute(versionId, contentId, userId);
      sendSuccess(res, version, 200);
    } catch (err) {
      next(err);
    }
  };
}
