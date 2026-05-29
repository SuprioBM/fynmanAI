import { Response } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import {
  formatEvaluationExportMarkdown,
  getConceptCoverageAndTopicDriftTrends,
  getFinalEvaluationExport,
  getSessionAnalytics,
  getUserProgress,
} from '#src/services/analytics.service.ts';

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const getDateRange = (query: AuthRequest['query']) => ({
  from: parseDate(query.from),
  to: parseDate(query.to),
});

export const getSessionAnalyticsHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const analytics = await getSessionAnalytics({
      userId: req.userId,
      sessionId,
    });

    if (!analytics) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    return sendApiSuccess(res, { data: { analytics } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch session analytics',
    });
  }
};

export const getUserProgressHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const progress = await getUserProgress({
      userId: req.userId,
      range: getDateRange(req.query),
    });

    return sendApiSuccess(res, { data: { progress } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch user progress',
    });
  }
};

export const getConceptTrendsHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const trends = await getConceptCoverageAndTopicDriftTrends({
      userId: req.userId,
      range: getDateRange(req.query),
    });

    return sendApiSuccess(res, { data: { trends } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch concept trends',
    });
  }
};

export const exportFinalEvaluationHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const format = req.query.format === 'markdown' ? 'markdown' : 'json';
    const exportData = await getFinalEvaluationExport({
      userId: req.userId,
      sessionId,
    });

    if (!exportData) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    if (!exportData.report) {
      return sendApiError(res, {
        status: 404,
        message: 'Final evaluation not available',
      });
    }

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="feynman-session-${sessionId}-report.md"`
      );
      return res.status(200).send(formatEvaluationExportMarkdown(exportData));
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="feynman-session-${sessionId}-report.json"`
    );
    return sendApiSuccess(res, { data: { export: exportData } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to export final evaluation',
    });
  }
};
