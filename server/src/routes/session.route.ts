import { Router } from 'express';
import {
  appendTranscriptHandler,
  endSessionHandler,
  getSessionReportHandler,
  requestFinalEvaluationHandler,
  requestRealtimeFeedbackHandler,
  startSessionHandler,
} from '#src/controllers/session.controller.ts';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  AppendTranscriptSchema,
  GenerateEvaluationSchema,
  StartSessionSchema,
} from '#src/validations/session.validation.ts';

const router = Router();
router.use(authMiddleware);

router.post('/', validateRequest(StartSessionSchema), startSessionHandler);
router.post(
  '/:sessionId/transcript',
  validateRequest(AppendTranscriptSchema),
  appendTranscriptHandler
);
router.post('/:sessionId/feedback', requestRealtimeFeedbackHandler);
router.post(
  '/:sessionId/evaluation',
  validateRequest(GenerateEvaluationSchema),
  requestFinalEvaluationHandler
);
router.get('/:sessionId/report', getSessionReportHandler);
router.post('/:sessionId/end', endSessionHandler);

export default router;
