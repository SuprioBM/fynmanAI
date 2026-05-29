import { Router } from 'express';
import {
  createResourceHandler,
  deleteResourceHandler,
  getResourceIngestionStatusHandler,
  getResourceHandler,
  listResourcesHandler,
  retryResourceIngestionHandler,
  updateResourceHandler,
} from '#src/controllers/resource.controller.ts';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  CreateResourceSchema,
  RetryResourceIngestionSchema,
  UpdateResourceSchema,
} from '#src/validations/resource.validation.ts';

const router = Router();
router.use(authMiddleware);

router.get('/', listResourcesHandler);
router.post('/', validateRequest(CreateResourceSchema), createResourceHandler);
router.get('/:resourceId/ingestion', getResourceIngestionStatusHandler);
router.post(
  '/:resourceId/retry',
  validateRequest(RetryResourceIngestionSchema),
  retryResourceIngestionHandler
);
router.get('/:resourceId', getResourceHandler);
router.patch(
  '/:resourceId',
  validateRequest(UpdateResourceSchema),
  updateResourceHandler
);
router.delete('/:resourceId', deleteResourceHandler);

export default router;
