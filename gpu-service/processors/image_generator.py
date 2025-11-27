import torch
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
from typing import Dict, Any, List
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class ImageGenerator:
    """AI Image Generation using Stable Diffusion XL"""
    
    def __init__(self, gpu_manager):
        self.gpu_manager = gpu_manager
        self.model_id = "stabilityai/stable-diffusion-xl-base-1.0"
    
    def load_model(self):
        """Load SDXL model with optimizations for 3050"""
        pipe = StableDiffusionXLPipeline.from_pretrained(
            self.model_id,
            torch_dtype=torch.float16,
            variant="fp16",
            use_safetensors=True
        )
        
        pipe = pipe.to(self.gpu_manager.device)
        
        # Apply optimizations
        pipe = self.gpu_manager.optimize_model(pipe)
        
        # Use efficient scheduler
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            pipe.scheduler.config
        )
        
        return pipe
    
    def process(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate images from prompt"""
        prompt = job_data.get('prompt')
        negative_prompt = job_data.get('negativePrompt', '')
        width = job_data.get('width', 1024)
        height = job_data.get('height', 1024)
        steps = job_data.get('steps', 30)
        num_images = job_data.get('numImages', 1)
        
        logger.info(f"Generating {num_images} images: {prompt[:50]}...")
        
        with self.gpu_manager.model_context('sdxl', self.load_model, required_vram_mb=4000):
            pipe = self.gpu_manager.loaded_models['sdxl']
            
            images = []
            for i in range(num_images):
                image = pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    width=width,
                    height=height,
                    num_inference_steps=steps,
                    guidance_scale=7.5
                ).images[0]
                
                # Save image
                output_path = f"/tmp/output_{job_data['jobId']}_{i}.png"
                image.save(output_path)
                images.append(output_path)
                
                logger.info(f"Generated image {i+1}/{num_images}")
        
        return {
            'images': images,
            'count': len(images)
        }
