import torch
from diffusers import StableDiffusionXLPipeline
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class InfluencerCreator:
    """Create realistic AI influencer personas with consistent faces"""
    
    def __init__(self, gpu_manager):
        self.gpu_manager = gpu_manager
        self.model_id = "stabilityai/stable-diffusion-xl-base-1.0"
    
    def load_model(self):
        """Load SDXL with face consistency models"""
        pipe = StableDiffusionXLPipeline.from_pretrained(
            self.model_id,
            torch_dtype=torch.float16,
            variant="fp16",
            use_safetensors=True
        )
        
        pipe = pipe.to(self.gpu_manager.device)
        pipe = self.gpu_manager.optimize_model(pipe)
        
        return pipe
    
    def generate_base_face(self, gender: str, ethnicity: str, age_range: str):
        """Generate base face for influencer"""
        prompt = f"professional portrait photo of a {age_range} year old {ethnicity} {gender}, "
        prompt += "perfect face, symmetrical features, high quality, 8k, detailed, photorealistic"
        
        return prompt
    
    def generate_poses(self, base_prompt: str, num_poses: int, style: str):
        """Generate multiple poses with consistent face"""
        poses = [
            "front facing portrait",
            "side profile view",
            "three quarter view",
            "smiling expression",
            "professional headshot",
            "casual outdoor setting",
            "studio lighting",
            "natural lighting",
            "fashion pose",
            "lifestyle photo"
        ]
        
        return poses[:num_poses]
    
    def process(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create AI influencer with multiple poses"""
        gender = job_data.get('gender')
        ethnicity = job_data.get('ethnicity')
        age_range = job_data.get('ageRange')
        style = job_data.get('style')
        num_poses = job_data.get('poses', 5)
        
        logger.info(f"Creating AI influencer: {gender}, {ethnicity}, {age_range}")
        
        with self.gpu_manager.model_context('influencer', self.load_model, required_vram_mb=4000):
            pipe = self.gpu_manager.loaded_models['influencer']
            
            # Generate base prompt
            base_prompt = self.generate_base_face(gender, ethnicity, age_range)
            
            # Generate poses
            pose_descriptions = self.generate_poses(base_prompt, num_poses, style)
            
            output_images = []
            for i, pose in enumerate(pose_descriptions):
                full_prompt = f"{base_prompt}, {pose}, {style} style"
                
                image = pipe(
                    prompt=full_prompt,
                    num_inference_steps=30,
                    guidance_scale=7.5
                ).images[0]
                
                output_path = f"/tmp/influencer_{job_data['jobId']}_{i}.png"
                image.save(output_path)
                output_images.append(output_path)
                
                logger.info(f"Generated pose {i+1}/{num_poses}")
        
        return {
            'images': output_images,
            'count': len(output_images),
            'persona': {
                'gender': gender,
                'ethnicity': ethnicity,
                'ageRange': age_range,
                'style': style
            }
        }
