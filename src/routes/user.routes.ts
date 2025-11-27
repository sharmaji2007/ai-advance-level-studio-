import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { pgPool } from '../database/connection';
import { getUserCredits } from '../services/credit.service';

const router = Router();

router.use(authenticate);

router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const result = await pgPool.query(
      `SELECT id, email, full_name, credits, subscription_tier, 
              subscription_expires_at, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/credits', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const credits = await getUserCredits(userId);

    res.json({ credits });
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await pgPool.query(
      `SELECT id, type, amount, credits, status, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, (Number(page) - 1) * Number(limit)]
    );

    res.json({
      transactions: result.rows,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
