import app, { redisClient } from './app.ts';
import logger from './config/logger.ts';

const PORT = process.env.PORT || 8000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis');
  })
  .catch(err => {
    logger.error(`Failed to connect to Redis: ${String(err)}`);
  });

app.listen(PORT, () => {
  console.log('start');
});

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down API server`);

  setTimeout(() => {
    logger.error('Forced API shutdown timeout reached');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
