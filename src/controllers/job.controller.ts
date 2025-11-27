import { Request, Response, NextFunction } from 'express';
import { jobQueue } from '../queues';
import { pgPool } from '../database/connection';
import JobMetadata from '../models/Job';
import { uploadToS3 } from '../services/storage.service';
import { deductCredits, hasEnoughCredits } from '../services/credit.service';
import { logger } from '../utils/logger';
import { emitJobUpdate } from '../websocket';

const CREDIT_COSTS = {
  'image-generation': parseInt(process.env.CREDIT_IMAGE_GENERATION || '2'),
  'cloth-swap': parseInt(process.env.CREDIT_CLOTH_SWAP || '3'),
  'influencer-creation': parseInt(process.env.CREDIT_INFLUENCER_CREATION || '5'),
  '3d-video': parseInt(process.env.CREDIT_3D_VIDEO_SHORT || '8'),
  'study-animation': parseInt(process.env.CREDIT_STUDY_ANIMATION || '5'),
  'story-video': parseInt(process.env.CREDIT_STORY_VIDEO || '10')
};

export async function createImageGeneration(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { prompt, style, negativePrompt, width, height, steps } = req.body;
    const jobType = 'image-generation';
    const creditsRequired = CREDIT_COSTS[jobType];

    // Check credits
    if (!await hasEnoughCredits(userId, creditsRequired)) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Upload reference image if provided
    let referenceUrl = null;
    if (req.file) {
      referenceUrl = await uploadToS3(req.file, userId, 'references');
    }

    // Create job in database
    const result = await pgPool.query(
      `INSERT INTO jobs (user_id, job_type, status, credits_used, input_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, jobType, 'pending', creditsRequired, JSON.stringify({
        prompt,
        style,
        negativePrompt,
        width: width || 1024,
        height: height || 1024,
        steps: steps || 30,
        referenceUrl
      })]
    );

    const jobId = result.rows[0].id;

    // Create metadata in MongoDB
    await JobMetadata.create({
      jobId,
      userId,
      jobType,
      inputFiles: req.file ? [{
        filename: req.file.originalname,
        path: referenceUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }] : [],
      parameters: { prompt, style, negativePrompt, width, height, steps },
      processingSteps: []
    });

    // Add to queue
    await jobQueue.add(jobType, {
      jobId,
      userId,
      prompt,
      style,
      negativePrompt,
      width: width || 1024,
      height: height || 1024,
      steps: steps || 30,
      referenceUrl
    }, {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    // Deduct credits
    await deductCredits(userId, creditsRequired, jobId);

    // Emit WebSocket update
    emitJobUpdate(userId, jobId, {
      status: 'pending',
      message: 'Job queued for processing'
    });

    res.status(202).json({
      jobId,
      status: 'pending',
      creditsUsed: creditsRequired,
      message: 'Job queued for processing'
    });
  } catch (error) {
    next(error);
  }
}

export async function createClothSwap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { category, preserveFace } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const jobType = 'cloth-swap';
    const creditsRequired = CREDIT_COSTS[jobType];

    if (!files.person || !files.cloth) {
      return res.status(400).json({ error: 'Both person and cloth images required' });
    }

    if (!await hasEnoughCredits(userId, creditsRequired)) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Upload images
    const personUrl = await uploadToS3(files.person[0], userId, 'inputs');
    const clothUrl = await uploadToS3(files.cloth[0], userId, 'inputs');

    const result = await pgPool.query(
      `INSERT INTO jobs (user_id, job_type, status, credits_used, input_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, jobType, 'pending', creditsRequired, JSON.stringify({
        personUrl,
        clothUrl,
        category,
        preserveFace: preserveFace !== false
      })]
    );

    const jobId = result.rows[0].id;

    await JobMetadata.create({
      jobId,
      userId,
      jobType,
      inputFiles: [
        {
          filename: files.person[0].originalname,
          path: personUrl,
          size: files.person[0].size,
          mimetype: files.person[0].mimetype
        },
        {
          filename: files.cloth[0].originalname,
          path: clothUrl,
          size: files.cloth[0].size,
          mimetype: files.cloth[0].mimetype
        }
      ],
      parameters: { category, preserveFace },
      processingSteps: []
    });

    await jobQueue.add(jobType, {
      jobId,
      userId,
      personUrl,
      clothUrl,
      category,
      preserveFace
    }, { jobId, attempts: 3 });

    await deductCredits(userId, creditsRequired, jobId);

    res.status(202).json({
      jobId,
      status: 'pending',
      creditsUsed: creditsRequired
    });
  } catch (error) {
    next(error);
  }
}

export async function createInfluencer(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { gender, ethnicity, ageRange, style, poses } = req.body;
    const jobType = 'influencer-creation';
    const creditsRequired = CREDIT_COSTS[jobType];

    if (!await hasEnoughCredits(userId, creditsRequired)) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    let referenceUrl = null;
    if (req.file) {
      referenceUrl = await uploadToS3(req.file, userId, 'references');
    }

    const result = await pgPool.query(
      `INSERT INTO jobs (user_id, job_type, status, credits_used, input_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, jobType, 'pending', creditsRequired, JSON.stringify({
        gender,
        ethnicity,
        ageRange,
        style,
        poses: poses || 5,
        referenceUrl
      })]
    );

    const jobId = result.rows[0].id;

    await jobQueue.add(jobType, {
      jobId,
      userId,
      gender,
      ethnicity,
      ageRange,
      style,
      poses,
      referenceUrl
    }, { jobId, attempts: 3 });

    await deductCredits(userId, creditsRequired, jobId);

    res.status(202).json({ jobId, status: 'pending', creditsUsed: creditsRequired });
  } catch (error) {
    next(error);
  }
}

export async function create3DVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { prompt, duration, cameraMovement, style } = req.body;
    const jobType = '3d-video';
    const creditsRequired = CREDIT_COSTS[jobType];

    if (!await hasEnoughCredits(userId, creditsRequired)) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    const result = await pgPool.query(
      `INSERT INTO jobs (user_id, job_type, status, credits_used, input_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, jobType, 'pending', creditsRequired, JSON.stringify({
        prompt,
        duration: duration || 30,
        cameraMovement,
        style
      })]
    );

    const jobId = result.rows[0].id;

    await jobQueue.add(jobType, {
      jobId,
      userId,
      prompt,
      duration,
      cameraMovement,
      style
    }, { jobId, attempts: 2, timeout: 600000 });

    await deductCredits(userId, creditsRequired, jobId);

    res.status(202).json({ jobId, status: 'pending', creditsUsed: creditsRequired });
  } catch (error) {
    next(error);
  }
}

export async function createStudyAnimation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { topic, script, subject, animationStyle, duration } = req.body;
    const jobType = 'study-animation';
    const creditsRequired = CREDIT_COSTS[jobType];

    if (!await hasEnoughCredits(userId, creditsRequired)) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    const result = await pgPool.query(
      `INSERT INTO jobs (user_id, job_type, status, credits_used, input_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, jobType, 'pending', creditsRequired, JSON.stringify({
        topic,
        script,
        subject,
        animationStyle,
        duration: duration || 60
      })]
    );

    const jobId = result.rows[0].id;

    await jobQueue.add(jobType, {
      jobId,
      userId,
      topic,
      script,
      subject,
      animationStyle,
      duration
    }, { jobId, attempts: 2, timeout: 600000 });

    await deductCredits(userId, creditsRequired, jobId);

    res.status(202).json({ jobId, status: 'pending', creditsUsed: creditsRequired });
  } catch (error) {
    next(error);
  }
}

export async function createStoryVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { script, visualStyle, voiceStyle, backgroundMusic } = req.body;
    const jobType = 'story-video';
    const creditsRequired = CREDIT_COSTS[jobType];

    if (!await hasEnoughCredits(userId, creditsRequired)) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    const result = await pgPool.query(
      `INSERT INTO jobs (user_id, job_type, status, credits_used, input_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, jobType, 'pending', creditsRequired, JSON.stringify({
        script,
        visualStyle,
        voiceStyle,
        backgroundMusic,
        duration: 180
      })]
    );

    const jobId = result.rows[0].id;

    await jobQueue.add(jobType, {
      jobId,
      userId,
      script,
      visualStyle,
      voiceStyle,
      backgroundMusic
    }, { jobId, attempts: 2, timeout: 900000 });

    await deductCredits(userId, creditsRequired, jobId);

    res.status(202).json({ jobId, status: 'pending', creditsUsed: creditsRequired });
  } catch (error) {
    next(error);
  }
}

export async function getJobStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const result = await pgPool.query(
      `SELECT id, job_type, status, credits_used, output_data, error_message, 
              processing_time_ms, created_at, completed_at
       FROM jobs WHERE id = $1 AND user_id = $2`,
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];
    const metadata = await JobMetadata.findOne({ jobId });

    res.json({
      ...job,
      metadata: metadata ? {
        processingSteps: metadata.processingSteps,
        outputFiles: metadata.outputFiles
      } : null
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, status, jobType } = req.query;

    let query = 'SELECT * FROM jobs WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (jobType) {
      query += ` AND job_type = $${paramIndex}`;
      params.push(jobType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (Number(page) - 1) * Number(limit));

    const result = await pgPool.query(query, params);

    res.json({
      jobs: result.rows,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const result = await pgPool.query(
      `UPDATE jobs SET status = 'cancelled' 
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id`,
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
    }

    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    next(error);
  }
}

export async function downloadResult(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const result = await pgPool.query(
      `SELECT output_data FROM jobs 
       WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not completed' });
    }

    const metadata = await JobMetadata.findOne({ jobId });

    res.json({
      files: metadata?.outputFiles || [],
      outputData: result.rows[0].output_data
    });
  } catch (error) {
    next(error);
  }
}
