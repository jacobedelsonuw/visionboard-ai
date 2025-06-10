window.CONFIG = {
    OPENAI: {
        API_KEY: 'your-openai-api-key-here'
    },
    REPLICATE: {
        ENABLED: true,
        MODEL_VERSION: 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478',
        SAFETY_CHECKER: true,
        QUALITY_LEVELS: {
            LOW: { steps: 5, width: 256, height: 256, guidance_scale: 3 },
            MEDIUM: { steps: 25, width: 768, height: 768, guidance_scale: 7.5 },
            HIGH: { steps: 50, width: 768, height: 1024, guidance_scale: 10 }
        }
    },
    LOCAL_SD: {
        ENABLED: true,
        API_BASE: "http://127.0.0.1:7860",
        QUALITY_LEVELS: {
            LOW: { steps: 5, width: 512, height: 512, cfg_scale: 5 },
            MEDIUM: { steps: 15, width: 768, height: 768, cfg_scale: 7.5 },
            HIGH: { steps: 30, width: 768, height: 1024, cfg_scale: 10 }
        }
    },
    OLLAMA: {
        ENABLED: true,
        BASE_URL: "http://localhost:11434",
        MODEL: "llama3.2:latest",
        CONTEXTUAL_GENERATION: {
            ENABLED: true,
            MIN_IMAGES_BEFORE_START: 1,
            INTERVAL: 5000
        }
    },
    // Progressive generation settings
    PROGRESSIVE_GENERATION: {
        ENABLED: true,
        SEQUENCE: ['LOW', 'HIGH', 'ENHANCED_HIGH'],
        DELAY_BETWEEN_GENERATIONS: 1000
    },
    // Service priority: Only Replicate and Local SD (no Picsum fallback)
    SERVICE_PRIORITY: ['REPLICATE', 'LOCAL_SD']
}; 