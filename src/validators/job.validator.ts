import Joi from 'joi';

export const jobSchemas = {
  imageGeneration: Joi.object({
    prompt: Joi.string().required().min(3).max(1000),
    style: Joi.string().valid('realistic', 'artistic', 'cinematic', 'anime', '3d-render'),
    negativePrompt: Joi.string().max(500),
    width: Joi.number().valid(512, 768, 1024, 1536),
    height: Joi.number().valid(512, 768, 1024, 1536),
    steps: Joi.number().min(20).max(50),
    numImages: Joi.number().min(1).max(4).default(1)
  }),

  clothSwap: Joi.object({
    category: Joi.string().valid('formal', 'traditional', 'western', 'fitness', 'casual').required(),
    preserveFace: Joi.boolean().default(true)
  }),

  influencerCreation: Joi.object({
    gender: Joi.string().valid('male', 'female', 'non-binary').required(),
    ethnicity: Joi.string().required(),
    ageRange: Joi.string().valid('18-25', '26-35', '36-45', '46+').required(),
    style: Joi.string().required(),
    poses: Joi.number().min(1).max(10).default(5)
  }),

  video3D: Joi.object({
    prompt: Joi.string().required().min(10).max(1000),
    duration: Joi.number().valid(15, 30, 60).default(30),
    cameraMovement: Joi.string().valid('orbit', 'dolly', 'pan', 'static').default('orbit'),
    style: Joi.string().valid('realistic', 'cartoon', 'cinematic', 'abstract').default('realistic')
  }),

  studyAnimation: Joi.object({
    topic: Joi.string().required().min(3).max(200),
    script: Joi.string().required().min(10).max(5000),
    subject: Joi.string().valid('science', 'mathematics', 'history', 'literature', 'technology').required(),
    animationStyle: Joi.string().valid('3d-cgi', 'whiteboard', 'explainer', 'motion-graphics').required(),
    duration: Joi.number().valid(30, 60, 120, 180).default(60)
  }),

  storyVideo: Joi.object({
    script: Joi.string().required().min(50).max(10000),
    visualStyle: Joi.string().valid('pixar', 'realistic', 'anime', 'cartoon', 'cinematic').required(),
    voiceStyle: Joi.string().valid('male-deep', 'male-warm', 'female-soft', 'female-energetic', 'child').required(),
    backgroundMusic: Joi.string().valid('epic', 'emotional', 'uplifting', 'mysterious', 'none').default('none')
  })
};
