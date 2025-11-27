import { pgPool } from '../database/connection';
import { logger } from '../utils/logger';

export async function hasEnoughCredits(userId: string, creditsRequired: number): Promise<boolean> {
  try {
    const result = await pgPool.query(
      'SELECT credits FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].credits >= creditsRequired;
  } catch (error) {
    logger.error('Error checking credits:', error);
    throw error;
  }
}

export async function deductCredits(userId: string, amount: number, jobId: string): Promise<void> {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Deduct credits
    const result = await client.query(
      'UPDATE users SET credits = credits - $1 WHERE id = $2 AND credits >= $1 RETURNING credits',
      [amount, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Insufficient credits');
    }

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'debit', 0, -amount, JSON.stringify({ jobId })]
    );

    await client.query('COMMIT');

    logger.info(`Deducted ${amount} credits from user ${userId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deducting credits:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function addCredits(userId: string, amount: number, transactionId?: string): Promise<void> {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2',
      [amount, userId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'credit', 0, amount, JSON.stringify({ transactionId })]
    );

    await client.query('COMMIT');

    logger.info(`Added ${amount} credits to user ${userId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error adding credits:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const result = await pgPool.query(
      'SELECT credits FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0]?.credits || 0;
  } catch (error) {
    logger.error('Error getting user credits:', error);
    throw error;
  }
}
