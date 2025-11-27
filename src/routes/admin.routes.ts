import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { pgPool } from '../database/connection';

const router = Router();

router.use(authenticate);

// Admin middleware (implement proper admin check)
const isAdmin = async (req: any, res: any, next: any) => {
  // TODO: Implement admin role check
  next();
};

router.get('/stats', isAdmin, async (req, res, next) => {
  try {
    const [users, jobs, revenue] = await Promise.all([
      pgPool.query('SELECT COUNT(*) as count FROM users'),
      pgPool.query('SELECT COUNT(*) as count, status FROM jobs GROUP BY status'),
      pgPool.query('SELECT SUM(amount) as total FROM transactions WHERE type = $1', ['credit'])
    ]);

    res.json({
      totalUsers: users.rows[0].count,
      jobs: jobs.rows,
      totalRevenue: revenue.rows[0]?.total || 0
    });
  } catch (error) {
    next(error);
  }
});

router.get('/gpu/metrics', isAdmin, async (req, res, next) => {
  try {
    const result = await pgPool.query(
      `SELECT AVG(vram_used_mb) as avg_vram,
              AVG(processing_time_ms) as avg_time,
              COUNT(*) as total_jobs
       FROM gpu_stats
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
