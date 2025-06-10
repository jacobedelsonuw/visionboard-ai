window.CONFIG = {
    OPENAI: {
        API_KEY: 'your-openai-api-key-here'
    },
    REPLICATE: {
        ENABLED: true,
        MODEL_VERSION: 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478',
        SAFETY_CHECKER: false,
        QUALITY_LEVELS: {
            LOW: { steps: 3, width: 256, height: 256, guidance_scale: 2 },
            MEDIUM: { steps: 8, width: 384, height: 384, guidance_scale: 4 },
            HIGH: { steps: 15, width: 512, height: 512, guidance_scale: 6 },
            ENHANCED_HIGH: { steps: 25, width: 768, height: 768, guidance_scale: 7.5 }
        }
    },
    LOCAL_SD: {
        ENABLED: true,
        API_BASE: "http://127.0.0.1:7860",
        QUALITY_LEVELS: {
            LOW: { steps: 5, width: 256, height: 256, cfg_scale: 3 },
            MEDIUM: { steps: 15, width: 384, height: 384, cfg_scale: 5 },
            HIGH: { steps: 25, width: 512, height: 512, cfg_scale: 7.5 },
            ENHANCED_HIGH: { steps: 30, width: 768, height: 768, cfg_scale: 8 }
        }
    },
    OLLAMA: {
        ENABLED: true,
        BASE_URL: "http://localhost:11434",
        MODEL: "llama3.2:latest",
        CONTEXTUAL_GENERATION: {
            ENABLED: true,
            MIN_IMAGES_BEFORE_START: 1,
            INTERVAL: 2000,
            MAX_CONTEXTUAL_IMAGES: 10
        }
    },
    ENHANCED_PROMPTS: {
        ENABLED: true,
        USE_REPLICATE_ENHANCEMENT: true,
        FALLBACK_TO_TEMPLATE: true,
        ENHANCEMENT_TIMEOUT: 8000
    },
    PROGRESSIVE_GENERATION: {
        ENABLED: true,
        SEQUENCE: ['LOW', 'MEDIUM', 'HIGH', 'ENHANCED_HIGH'],
        DELAY_BETWEEN_GENERATIONS: 200,
        GENERATE_SMALL_BOXES: true,
        BACKGROUND_ENHANCEMENT: true
    },
    AUTO_GENERATION: {
        ENABLED: true,
        INTERVAL: 800,
        MAX_AUTO_IMAGES: 15,
        QUICK_GENERATION: true
    },
    AUDIO_INPUT: {
        ENABLED: true,
        SHOW_TRANSCRIPT_LIVE: true,
        AUTO_ANALYZE_SENTIMENT: true
    },
    SERVICE_PRIORITY: ['REPLICATE', 'LOCAL_SD']
}; 