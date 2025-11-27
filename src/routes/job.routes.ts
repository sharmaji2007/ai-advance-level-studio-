import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { upload } from '../middleware/upload';
import * as jobController from '../controllers/job.controller';
import { jobSchemas } from '../validators/job.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Image Generation
router.post(
  '/image-generation',
  upload.single('reference'),
  validateRequest(jobSchemas.imageGeneration),
  jobController.createImageGeneration
);

// Cloth Swap
router.post(
  '/cloth-swap',
  upload.fields([
    { name: 'person', maxCount: 1 },
    { name: 'cloth', maxCount: 1 }
  ]),
  validateRequest(jobSchemas.clothSwap),
  jobController.createClothSwap
);

// AI Influencer Creation
router.post(
  '/influencer-creation',
  upload.single('reference'),
  validateRequest(jobSchemas.influencerCreation),
  jobController.createInfluencer
);

// 3D Video Generation
router.post(
  '/3d-video',
  validateRequest(jobSchemas.video3D),
  jobController.create3DVideo
);

// Study Animation
router.post(
  '/study-animation',
  validateRequest(jobSchemas.studyAnimation),
  jobController.createStudyAnimation
);

// Story Video
router.post(
  '/story-video',
  validateRequest(jobSchemas.storyVideo),
  jobController.createStoryVideo
);

// Get job status
router.get('/:jobId', jobController.getJobStatus);

// Get user jobs
router.get('/', jobController.getUserJobs);

// Cancel job
router.delete('/:jobId', jobController.cancelJob);

// Download result
router.get('/:jobId/download', jobController.downloadResult);

export default router;
