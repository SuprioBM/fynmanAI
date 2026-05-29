import { Router } from 'express';
import { getSystemHealth } from '#src/services/health.service.ts';
import { sendApiSuccess } from '#src/utils/api-response.ts';

const router = Router();

router.get('/', async (_req, res) => {
  const health = await getSystemHealth();
  const statusCode =
    health.status === 'ok' ? 200 : health.status === 'degraded' ? 207 : 503;

  return sendApiSuccess(res, {
    status: statusCode,
    data: health,
  });
});

export default router;
