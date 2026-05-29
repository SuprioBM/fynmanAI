import { Router } from 'express';
import {
  exportFinalEvaluationHandler,
  getConceptTrendsHandler,
  getSessionAnalyticsHandler,
  getUserProgressHandler,
} from '#src/controllers/analytics.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';

const router = Router();
router.use(authMiddleware);

router.get('/sessions/:sessionId', getSessionAnalyticsHandler);
router.get('/progress', getUserProgressHandler);
router.get('/trends', getConceptTrendsHandler);
router.get('/sessions/:sessionId/report/export', exportFinalEvaluationHandler);

export default router;
