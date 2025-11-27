import Redis from 'redis';
import { logger } from '../utils/logger';
import { emitJobUpdate, emitJobProgress, emitJobComplete, emitJobError } from '../websocket';
import { pgPool } from '../database/connection';

const redisSubscriber = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
});

export async function initializeWebSocketListener() {
  try {
    await redisSubscriber.connect();
    logger.info('Redis subscriber connected for WebSocket updates');

    // Subscribe to job update channel
    await redisSubscriber.subscribe('job-updates', async (message) => {
      try {
        const update = JSON.parse(message);
        const { jobId, status, result, error, progress, message: msg } = update;

        // Get user ID from database
        const jobResult = await pgPool.query(
          'SELECT user_id FROM jobs WHERE id = $1',
          [jobId]
        );

        if (jobResult.rows.length === 0) {
          logger.warn(`Job ${jobId} not found for WebSocket update`);
          return;
        }

        const userId = jobResult.rows[0].user_id;

        // Emit appropriate WebSocket event based on status
        switch (status) {
          case 'processing':
            emitJobUpdate(userId, jobId, { status, message: msg || 'Processing started' });
            break;

          case 'progress':
            emitJobProgress(userId, jobId, progress, msg);
            break;

          case 'completed':
            emitJobComplete(userId, jobId, result);
            // Update database
            await pgPool.query(
              `UPDATE jobs SET status = $1, output_data = $2, completed_at = NOW()
               WHERE id = $3`,
              ['completed', JSON.stringify(result), jobId]
            );
            break;

          case 'failed':
            emitJobError(userId, jobId, error || 'Job failed');
            // Update database
            await pgPool.query(
              `UPDATE jobs SET status = $1, error_message = $2, completed_at = NOW()
               WHERE id = $3`,
              ['failed', error, jobId]
            );
            break;

          default:
            emitJobUpdate(userId, jobId, { status, message: msg });
        }

        logger.info(`WebSocket update processed for job ${jobId}: ${status}`);
      } catch (error) {
        logger.error('Error processing WebSocket update:', error);
      }
    });

    logger.info('WebSocket listener initialized');
  } catch (error) {
    logger.error('Failed to initialize WebSocket listener:', error);
    throw error;
  }
}

export async function closeWebSocketListener() {
  try {
    await redisSubscriber.unsubscribe('job-updates');
    await redisSubscriber.quit();
    logger.info('WebSocket listener closed');
  } catch (error) {
    logger.error('Error closing WebSocket listener:', error);
  }
}
