import redis
import json
import logging
import torch
from typing import Dict, Any
from processors.image_generator import ImageGenerator
from processors.cloth_swap import ClothSwapProcessor
from processors.influencer_creator import InfluencerCreator
from processors.video_3d import Video3DGenerator
from processors.study_animation import StudyAnimationGenerator
from processors.story_video import StoryVideoGenerator
from gpu_manager import GPUManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Redis
redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)

# Initialize GPU Manager
gpu_manager = GPUManager(max_vram_mb=7500)

# Initialize processors (lazy loading)
processors = {}

def get_processor(job_type: str):
    """Lazy load processors to save VRAM"""
    if job_type not in processors:
        logger.info(f"Loading processor for {job_type}")
        
        if job_type == 'image-generation':
            processors[job_type] = ImageGenerator(gpu_manager)
        elif job_type == 'cloth-swap':
            processors[job_type] = ClothSwapProcessor(gpu_manager)
        elif job_type == 'influencer-creation':
            processors[job_type] = InfluencerCreator(gpu_manager)
        elif job_type == '3d-video':
            processors[job_type] = Video3DGenerator(gpu_manager)
        elif job_type == 'study-animation':
            processors[job_type] = StudyAnimationGenerator(gpu_manager)
        elif job_type == 'story-video':
            processors[job_type] = StoryVideoGenerator(gpu_manager)
        else:
            raise ValueError(f"Unknown job type: {job_type}")
    
    return processors[job_type]

def process_job(job_data: Dict[str, Any]):
    """Process a single job"""
    job_id = job_data.get('jobId')
    job_type = job_data.get('data', {}).get('jobType')
    
    try:
        logger.info(f"Processing job {job_id} of type {job_type}")
        
        # Update job status
        update_job_status(job_id, 'processing')
        
        # Get processor
        processor = get_processor(job_type)
        
        # Process job
        result = processor.process(job_data['data'])
        
        # Update job with result
        update_job_status(job_id, 'completed', result)
        
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        update_job_status(job_id, 'failed', error=str(e))
        
        # Clear GPU memory on error
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

def update_job_status(job_id: str, status: str, result: Dict = None, error: str = None):
    """Update job status in Redis"""
    update_data = {
        'status': status,
        'jobId': job_id
    }
    
    if result:
        update_data['result'] = result
    if error:
        update_data['error'] = error
    
    redis_client.publish('job-updates', json.dumps(update_data))

def start_worker():
    """Start the job worker"""
    logger.info("GPU Worker started, waiting for jobs...")
    
    while True:
        try:
            # Block and wait for jobs from Bull queue
            # Bull uses Redis lists for queue management
            job_data = redis_client.blpop('bull:job-queue:wait', timeout=5)
            
            if job_data:
                job_json = json.loads(job_data[1])
                process_job(job_json)
                
        except KeyboardInterrupt:
            logger.info("Worker shutting down...")
            break
        except Exception as e:
            logger.error(f"Worker error: {str(e)}")
            continue

if __name__ == "__main__":
    start_worker()
