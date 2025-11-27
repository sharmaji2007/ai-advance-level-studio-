# GPU Service Guide

## Overview
The GPU service handles all AI model inference for media generation. It's optimized for NVIDIA 3050 (8GB VRAM).

## Architecture

```
Redis Queue → Worker → GPU Manager → Model Processors → Output
```

## GPU Optimization Strategies

### 1. Memory Management
- **FP16 Precision**: All models use half-precision (float16) to reduce VRAM usage by 50%
- **Dynamic Loading**: Models are loaded only when needed and unloaded after use
- **Attention Slicing**: Reduces memory usage during inference
- **VAE Slicing**: Splits VAE operations to use less memory
- **xFormers**: Memory-efficient attention implementation

### 2. Model Optimization
```python
# Enable optimizations
pipe.enable_xformers_memory_efficient_attention()
pipe.enable_attention_slicing(1)
pipe.enable_vae_slicing()
```

### 3. Batch Processing
- Batch size dynamically adjusted based on available VRAM
- Sequential processing for large jobs to prevent OOM errors

### 4. Queue Management
- Maximum 2 concurrent jobs on 3050
- Priority queue for different job types
- Automatic retry on failure

## VRAM Usage by Model

| Model | VRAM Required | Optimization |
|-------|---------------|--------------|
| SDXL Base | ~4GB | FP16 + Attention Slicing |
| Cloth Swap | ~3GB | FP16 + Model Quantization |
| Video Generation | ~5GB | Sequential Frame Generation |
| 3D Rendering | ~3.5GB | Batch Rendering |

## Configuration

### Environment Variables
```bash
GPU_MAX_CONCURRENT_JOBS=2
GPU_VRAM_LIMIT=7500  # MB
MODEL_CACHE_DIR=/models
```

### Model Paths
Models are automatically downloaded on first use:
- Stable Diffusion XL: `stabilityai/stable-diffusion-xl-base-1.0`
- ControlNet: `lllyasviel/control_v11p_sd15_openpose`

## Monitoring

### GPU Stats Endpoint
```http
GET http://localhost:8000/gpu/stats
```

Response:
```json
{
  "vram_allocated": 4500,
  "vram_reserved": 5000,
  "vram_total": 8192
}
```

### Health Check
```http
GET http://localhost:8000/health
```

## Performance Tips

### For NVIDIA 3050 (8GB)

1. **Enable TensorFloat-32**
```python
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True
```

2. **Clear Cache Between Jobs**
```python
torch.cuda.empty_cache()
gc.collect()
```

3. **Use Efficient Schedulers**
```python
from diffusers import DPMSolverMultistepScheduler
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
```

4. **Reduce Inference Steps**
- Standard: 30 steps
- Fast: 20 steps (slight quality loss)

## Troubleshooting

### Out of Memory (OOM)
```
RuntimeError: CUDA out of memory
```

Solutions:
1. Reduce batch size
2. Enable all memory optimizations
3. Unload unused models
4. Reduce image resolution

### Slow Processing
- Check GPU utilization: `nvidia-smi`
- Ensure CUDA is properly installed
- Verify xFormers is installed
- Use faster schedulers

### Model Loading Errors
```bash
# Clear model cache
rm -rf ~/.cache/huggingface/

# Re-download models
python -c "from diffusers import StableDiffusionXLPipeline; StableDiffusionXLPipeline.from_pretrained('stabilityai/stable-diffusion-xl-base-1.0')"
```

## Scaling

### Multiple GPUs
Modify `docker-compose.yml`:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          device_ids: ['0', '1']
          capabilities: [gpu]
```

### GPU Cluster
Use Ray or Celery for distributed processing across multiple machines.

## Development

### Adding New Processors

1. Create processor class:
```python
class NewProcessor:
    def __init__(self, gpu_manager):
        self.gpu_manager = gpu_manager
    
    def load_model(self):
        # Load your model
        pass
    
    def process(self, job_data):
        # Process job
        pass
```

2. Register in `worker.py`:
```python
elif job_type == 'new-processor':
    processors[job_type] = NewProcessor(gpu_manager)
```

## Best Practices

1. **Always use context managers** for model loading
2. **Clear GPU cache** after each job
3. **Monitor VRAM usage** during development
4. **Test with actual 3050** before production
5. **Implement proper error handling** for OOM scenarios
6. **Use model quantization** for larger models
7. **Cache preprocessed inputs** when possible
