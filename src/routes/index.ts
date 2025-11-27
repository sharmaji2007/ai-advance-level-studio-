import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import userRoutes from './user.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
