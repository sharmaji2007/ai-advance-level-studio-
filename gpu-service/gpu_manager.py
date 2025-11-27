import torch
import gc
import logging
from typing import Optional, Dict, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class GPUManager:
    """Manages GPU memory and model loading for NVIDIA 3050 (8GB VRAM)"""
    
    def __init__(self, max_vram_mb: int = 7500):
        self.max_vram_mb = max_vram_mb
        self.loaded_models: Dict[str, Any] = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        if self.device == "cuda":
            # Enable memory efficient attention
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
            logger.info(f"GPU Manager initialized on {torch.cuda.get_device_name(0)}")
        else:
            logger.warning("CUDA not available, using CPU")
    
    def get_vram_usage(self) -> int:
        """Get current VRAM usage in MB"""
        if self.device == "cpu":
            return 0
        return torch.cuda.memory_allocated(0) // (1024 ** 2)
    
    def get_available_vram(self) -> int:
        """Get available VRAM in MB"""
        return self.max_vram_mb - self.get_vram_usage()
    
    def clear_cache(self):
        """Clear GPU cache"""
        if self.device == "cuda":
            torch.cuda.empty_cache()
            gc.collect()
            logger.info("GPU cache cleared")
    
    def unload_model(self, model_name: str):
        """Unload a specific model from memory"""
        if model_name in self.loaded_models:
            del self.loaded_models[model_name]
            self.clear_cache()
            logger.info(f"Model {model_name} unloaded")
    
    def unload_all_models(self):
        """Unload all models from memory"""
        self.loaded_models.clear()
        self.clear_cache()
        logger.info("All models unloaded")
    
    @contextmanager
    def model_context(self, model_name: str, model_loader_fn, required_vram_mb: int = 2000):
        """Context manager for loading/unloading models"""
        try:
            # Check if we need to free memory
            if self.get_available_vram() < required_vram_mb:
                logger.info(f"Insufficient VRAM, clearing cache...")
                self.unload_all_models()
            
            # Load model if not already loaded
            if model_name not in self.loaded_models:
                logger.info(f"Loading model: {model_name}")
                self.loaded_models[model_name] = model_loader_fn()
                logger.info(f"Model loaded. VRAM usage: {self.get_vram_usage()}MB")
            
            yield self.loaded_models[model_name]
            
        finally:
            # Optionally unload after use to free memory
            pass
    
    def optimize_model(self, model):
        """Apply optimizations for 3050 GPU"""
        if self.device == "cpu":
            return model
        
        # Enable memory efficient attention if available
        if hasattr(model, 'enable_xformers_memory_efficient_attention'):
            try:
                model.enable_xformers_memory_efficient_attention()
                logger.info("xFormers memory efficient attention enabled")
            except Exception as e:
                logger.warning(f"Could not enable xFormers: {e}")
        
        # Enable attention slicing for lower VRAM usage
        if hasattr(model, 'enable_attention_slicing'):
            model.enable_attention_slicing(1)
            logger.info("Attention slicing enabled")
        
        # Enable VAE slicing
        if hasattr(model, 'enable_vae_slicing'):
            model.enable_vae_slicing()
            logger.info("VAE slicing enabled")
        
        return model
    
    def get_optimal_batch_size(self, base_batch_size: int = 1) -> int:
        """Calculate optimal batch size based on available VRAM"""
        available = self.get_available_vram()
        
        if available > 4000:
            return base_batch_size * 2
        elif available > 2000:
            return base_batch_size
        else:
            return 1
