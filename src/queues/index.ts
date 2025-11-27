import Queue from 'bull';
import Redis from 'redis';
import { logger } from '../utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
};

// Create job queue
export const jobQueue = new Queue('job-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
});

// Queue event handlers
jobQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, { result });
});

jobQueue.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: err.message });
});

jobQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

// Initialize queues
export async function initializeQueues() {
  try {
    await jobQueue.isReady();
    logger.info('Job queue initialized');

    // Clean old jobs
    await jobQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed'); // 7 days
    await jobQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');

    logger.info('Queue cleanup completed');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
}

export default jobQueue;
