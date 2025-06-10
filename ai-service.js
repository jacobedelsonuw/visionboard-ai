export class AIImageService {
    constructor(config = window.CONFIG, addImageCallback = null) {
        this.config = config;
        this.ollamaAvailable = false;
        this.contextHistory = []; // Store spoken text for context
        this.imagePrompts = []; // Store all generated image prompts
        this.addImageCallback = addImageCallback;
        this.checkOllamaAvailability();
        this._countWords = this._countWords.bind(this);
    }

    async checkOllamaAvailability() {
        try {
            const response = await fetch(`${this.config.OLLAMA.BASE_URL}/api/tags`);
            if (response.ok) {
                this.ollamaAvailable = true;
                const data = await response.json();
                console.log('🦙 Ollama available with models:', data.models?.map(m => m.name) || []);
            }
        } catch (error) {
            console.log('🦙 Ollama not available, falling back to other services');
            this.ollamaAvailable = false;
        }
    }

    // Add spoken text to context history
    addToContext(text, generatedPrompt = null) {
        this.contextHistory.push({
            timestamp: Date.now(),
            originalText: text,
            enhancedPrompt: generatedPrompt,
        });
        
        // Keep only recent context
        const maxHistory = this.config.OLLAMA.CONTEXTUAL_GENERATION.MAX_CONTEXT_HISTORY;
        if (this.contextHistory.length > maxHistory) {
            this.contextHistory = this.contextHistory.slice(-maxHistory);
        }
        
        // Store image prompts separately
        if (generatedPrompt) {
            this.imagePrompts.push(generatedPrompt);
            if (this.imagePrompts.length > maxHistory) {
                this.imagePrompts = this.imagePrompts.slice(-maxHistory);
            }
        }
    }

    // Analyze overall context and suggest a new image
    async analyzeOverallContext(promptHistory) {
        if (!this.config.OLLAMA.ENABLED) {
            return this.generateFallbackPrompt(promptHistory);
        }

        try {
            const model = this.config.OLLAMA.MODEL || 'llama2';
            console.log(`🔍 Using Ollama model: ${model} for contextual analysis`);
            
            // First check if Ollama is available
            try {
                const healthCheck = await fetch('http://localhost:11434/api/health');
                if (!healthCheck.ok) {
                    console.warn('⚠️ Ollama is not running, using fallback prompt generation');
                    return this.generateFallbackPrompt(promptHistory);
                }
            } catch (error) {
                console.warn('⚠️ Ollama health check failed:', error);
                return this.generateFallbackPrompt(promptHistory);
            }

            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    prompt: `Based on these recent image prompts: "${promptHistory.join(', ')}", generate a new creative prompt that would complement them. The prompt should be artistic and descriptive.`,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama contextual analysis error: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.response) {
                return data.response.trim();
            }
            return this.generateFallbackPrompt(promptHistory);
        } catch (error) {
            console.error('Contextual generation failed:', error);
            return this.generateFallbackPrompt(promptHistory);
        }
    }

    generateFallbackPrompt(promptHistory = []) {
        // If we have prompt history, try to create a related prompt
        if (promptHistory.length > 0) {
            const lastPrompt = promptHistory[promptHistory.length - 1];
            const themes = [
                'complementary', 'contrasting', 'expanding', 'variation of',
                'alternative view of', 'different perspective on'
            ];
            const theme = themes[Math.floor(Math.random() * themes.length)];
            return `${theme} ${lastPrompt}`;
        }

        // Otherwise use a random creative prompt
        const prompts = [
            "A serene landscape with mountains and a lake at sunset",
            "An abstract composition with vibrant colors and geometric shapes",
            "A peaceful garden scene with blooming flowers and butterflies",
            "A futuristic cityscape with flying vehicles and neon lights",
            "A cozy interior with warm lighting and comfortable furniture",
            "A magical forest with glowing mushrooms and fairy lights",
            "A minimalist design with clean lines and subtle textures",
            "A dramatic seascape with crashing waves and stormy skies",
            "A whimsical illustration with playful characters and patterns",
            "A vintage photograph with nostalgic atmosphere and warm tones"
        ];
        
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        console.log('🎲 Using fallback prompt:', randomPrompt);
        return randomPrompt;
    }

    async generateContextualImage(promptHistory) {
        if (!this.canStartContextualGeneration()) {
            return null;
        }

        try {
            const contextAnalysis = await this.analyzeOverallContext(promptHistory);
            if (!contextAnalysis) {
                return null;
            }
            return await this.generateImage(contextAnalysis, true); // true = contextual generation
        } catch (error) {
            console.error('Contextual generation failed:', error);
            return null;
        }
    }

    async generateImage(prompt) {
        console.log('🎨 Starting progressive image generation for prompt:', prompt);
        
        if (this.config.PROGRESSIVE_GENERATION?.ENABLED) {
            return this._generateProgressiveImages(prompt);
        } else {
            // Fallback to single image generation
            return this._generateImageFromServices(prompt);
        }
    }

    async _generateProgressiveImages(prompt) {
        console.log('🎨 Starting progressive image generation for prompt:', prompt);
        const sequence = this.config.PROGRESSIVE_GENERATION.SEQUENCE;
        console.log('🔄 Progressive generation sequence:', sequence);
        
        let lastImageUrl = null;
        let imageElement = null;
        let imageId = null;
        
        for (let i = 0; i < sequence.length; i++) {
            const quality = sequence[i];
            const delay = this.config.PROGRESSIVE_GENERATION.DELAY_BETWEEN_GENERATIONS || 500;
            
            try {
                console.log(`🎨 Generating ${quality} quality image...`);
                const imageUrl = await this._generateImageWithQuality(prompt, quality, this.replicateFailures);
                
                if (imageUrl) {
                    lastImageUrl = imageUrl;
                    
                    if (i === 0) {
                        // First image (LOW quality): Add to board immediately
                        console.log(`✅ ${quality} quality image generated - adding to board`);
                        if (this.addImageCallback) {
                            imageId = this.addImageCallback(imageUrl, prompt);
                            console.log(`📋 Added initial ${quality} image to board with ID: ${imageId}`);
                        }
                    } else {
                        // Higher quality images: Replace existing image in background
                        console.log(`✅ ${quality} quality image generated - upgrading existing image`);
                        if (this.addImageCallback && imageId) {
                            // Use a special method to replace/upgrade existing image
                            this.upgradeImageCallback && this.upgradeImageCallback(imageId, imageUrl, `${prompt} (${quality} quality)`);
                            console.log(`🔄 Upgraded image ${imageId} to ${quality} quality`);
                        }
                    }
                    
                    // Add delay before next quality level (except for the last one)
                    if (i < sequence.length - 1) {
                        console.log(`⏳ Waiting ${delay}ms before generating ${sequence[i + 1]} quality...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    console.warn(`⚠️ Failed to generate ${quality} quality image, continuing with next quality level...`);
                }
            } catch (error) {
                console.error(`❌ Error generating ${quality} quality:`, error.message);
                
                // For the first image, still try to continue with higher quality
                if (i === 0) {
                    console.log('🔄 First image failed, trying next quality level...');
                } else {
                    console.log(`🔄 ${quality} enhancement failed, continuing background enhancement...`);
                }
            }
        }
        
        console.log('🏁 Progressive generation completed');
        return lastImageUrl;
    }

    async _generateImageWithQualitySkipReplicate(prompt, quality) {
        const servicePriority = ['LOCAL_SD']; // Skip Replicate, only use Local SD
        
        for (const service of servicePriority) {
            try {
                console.log(`🚀 Trying ${service} for ${quality} quality image...`);
                let imageUrl = null;
                
                switch (service) {
                    case 'LOCAL_SD':
                        if (this.config.LOCAL_SD.ENABLED) {
                            imageUrl = await this.generateWithLocalSDQuality(prompt, quality);
                        }
                        break;
                }
                
                if (imageUrl) {
                    console.log(`✅ Successfully generated ${quality} image with ${service}`);
                    return imageUrl;
                }
            } catch (error) {
                console.error(`❌ Error with ${service} for ${quality}:`, error.message);
            }
        }
        
        console.warn(`⚠️ Failed to generate ${quality} image with available services`);
        return null; // Return null instead of Picsum fallback
    }

    async _generateImageWithQuality(prompt, quality, replicateFailures) {
        const servicePriority = this.config.SERVICE_PRIORITY || ['REPLICATE', 'LOCAL_SD'];
        
        for (const service of servicePriority) {
            try {
                console.log(`🚀 Trying ${service} for ${quality} quality image...`);
                let imageUrl = null;
                
                switch (service) {
                    case 'REPLICATE':
                        if (this.config.REPLICATE.ENABLED) {
                            imageUrl = await this.generateWithReplicateQuality(prompt, quality);
                        }
                        break;
                    case 'LOCAL_SD':
                        if (this.config.LOCAL_SD.ENABLED) {
                            imageUrl = await this.generateWithLocalSDQuality(prompt, quality);
                        }
                        break;
                }
                
                if (imageUrl) {
                    console.log(`✅ Successfully generated ${quality} image with ${service}`);
                    return imageUrl;
                }
            } catch (error) {
                console.error(`❌ Error with ${service} for ${quality}:`, error.message);
            }
        }
        
        console.warn(`⚠️ Failed to generate ${quality} image with all available services`);
        return null; // Return null instead of Picsum fallback
    }

    async generateWithReplicateQuality(prompt, quality) {
        console.log(`🎨 Using Replicate API with ${quality} quality settings:`, this.config.REPLICATE.QUALITY_LEVELS[quality]);
        const qualitySettings = this.config.REPLICATE.QUALITY_LEVELS[quality] || this.config.REPLICATE.QUALITY_LEVELS.MEDIUM;
        
        try {
            const prediction = await fetch('http://localhost:3000/api/replicate/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: this.config.REPLICATE.MODEL_VERSION,
                    input: {
                        prompt: prompt,
                        width: qualitySettings.width,
                        height: qualitySettings.height,
                        num_inference_steps: qualitySettings.steps,
                        guidance_scale: qualitySettings.guidance_scale,
                        safety_checker: false // Disabled to allow romantic/love content
                    }
                })
            });

            if (!prediction.ok) {
                const errorBody = await prediction.text();
                throw new Error(`Replicate API error: ${errorBody}`);
            }

            const predictionData = await prediction.json();
            console.log(`🔗 Prediction created with ID: ${predictionData.id}`);

            // Poll for the result
            const imageUrl = await this.pollReplicatePrediction(predictionData.id, 60, quality);
            console.log(`🖼️ Replicate ${quality} image generated successfully.`);
            return imageUrl;
            
        } catch (error) {
            console.warn(`⚠️ Replicate ${quality} generation failed:`, error);
            throw new Error(`Replicate API error: ${error.message}`);
        }
    }

    async generateWithLocalSDQuality(prompt, quality) {
        console.log(`🎨 Using local Stable Diffusion with ${quality} quality...`);
        const qualitySettings = this.config.LOCAL_SD.QUALITY_LEVELS[quality] || this.config.LOCAL_SD.QUALITY_LEVELS.MEDIUM;
        const endpoint = `${this.config.LOCAL_SD.API_BASE}/sdapi/v1/txt2img`;

        const payload = {
            "prompt": prompt,
            "negative_prompt": "blurry, bad art, low quality, text, watermark",
            "steps": qualitySettings.steps,
            "width": qualitySettings.width,
            "height": qualitySettings.height,
            "cfg_scale": qualitySettings.cfg_scale,
            "sampler_name": "DPM++ 2M Karras"
        };

        console.log(`🎨 Local SD ${quality} generation starting (${qualitySettings.steps} steps)...`);
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Local SD API error (${quality}):`, response.status, errorBody);
                throw new Error(`Local SD API error: ${response.status}`);
            }

            const data = await response.json();
            if (data.images && data.images[0]) {
                console.log(`🖼️ Local SD ${quality} image generated.`);
                return `data:image/png;base64,${data.images[0]}`;
            } else {
                console.error(`Local SD returned 200 OK but no image data for ${quality} generation.`, data.info || '');
                throw new Error('Stable Diffusion returned an empty response.');
            }
        } catch (error) {
            console.warn(`⚠️ Local SD ${quality} generation failed:`, error);
            throw new Error(`Local SD ${quality} generation failed.`);
        }
    }

    // New method to handle background generation of the enhanced image
    _getEnhancedImageInBackground(prompt) {
        // Run this entire process in the background without blocking the main thread
        (async () => {
            try {
                console.log('🤗 Attempting background prompt enhancement (no timeout)...');
                // Enhance the prompt again, but with a much longer timeout
                const enhancedPrompt = await this._enhancePrompt(prompt, false);

                if (enhancedPrompt && enhancedPrompt !== prompt) {
                    console.log('✨ Successfully enhanced prompt in background:', enhancedPrompt);
                    const imageUrl = await this._generateImageFromServices(enhancedPrompt);

                    if (imageUrl && this.addImageCallback) {
                        console.log('🖼️ Adding enhanced image to board from background task.');
                        // Use the callback to add the second image, marking it as enhanced
                        this.addImageCallback(imageUrl, `(Enhanced) ${prompt}`);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Background prompt enhancement failed:', error);
            }
        })();
    }

    // Refactored helper to call the Hugging Face API for prompt enhancement
    async _enhancePrompt(prompt, isContextual = false) {
        if (!this.config.REPLICATE.ENABLED) {
            return null;
        }

        try {
            console.log('✨ Enhancing prompt with Replicate...');
            
            const response = await fetch('/api/replicate/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `You are an expert at creating detailed, artistic image generation prompts. Enhance this prompt to be more detailed and visually rich: "${prompt}". Focus on artistic elements, composition, lighting, and mood.`,
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                throw new Error(`Replicate API error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.enhancedPrompt) {
                const cleanedPrompt = await this._parseEnhancedPrompt(data.enhancedPrompt);
                if (cleanedPrompt) {
                    console.log('✨ Enhanced prompt:', cleanedPrompt);
                    return cleanedPrompt;
                }
            }
            return null;
        } catch (error) {
            console.warn('⚠️ Prompt enhancement failed:', error);
            return null;
        }
    }

    async _parseEnhancedPrompt(response) {
        if (!response) return null;
        
        try {
            // Handle both string and array responses
            const text = Array.isArray(response) ? response.join(' ') : response;
            const words = this._countWords(text);
            
            if (words < 3) {
                console.warn('⚠️ Enhanced prompt too short:', text);
                return null;
            }
            
            return text.trim();
        } catch (error) {
            console.error('Failed to parse enhanced prompt:', error);
            return null;
        }
    }

    _countWords(str) {
        if (!str || typeof str !== 'string') return 0;
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Refactored helper that iterates through the available image generation services
    async _generateImageFromServices(prompt) {
        const servicePriority = this.config.SERVICE_PRIORITY || ['PICSUM', 'REPLICATE', 'LOCAL_SD', 'OPENAI'];
        let lastError = null;
        
        console.log('🔍 Using service priority:', servicePriority);

        // First, try all configured services
        for (const service of servicePriority) {
            try {
                console.log(`🚀 Trying ${service} for image generation...`);
                let imageUrl = null;
                
                switch (service) {
                    case 'PICSUM':
                        // Picsum Photos is always available and free
                        console.log('Trying Picsum Photos...');
                        imageUrl = await this.generateWithPicsum(prompt);
                        break;
                    case 'LOCAL_SD':
                        if (this.config.LOCAL_SD.ENABLED) {
                            console.log('Trying Local SD...');
                            imageUrl = await this.generateWithLocalSD(prompt);
                        }
                        break;
                    case 'REPLICATE':
                        if (this.config.REPLICATE.ENABLED) {
                            console.log('Trying Replicate...');
                            imageUrl = await this.generateWithReplicate(prompt);
                        }
                        break;
                    case 'OPENAI':
                        if (this.config.OPENAI.ENABLED && this.config.OPENAI.API_KEY) {
                            console.log('Trying DALL-E...');
                            imageUrl = await this.generateWithDALLE(prompt);
                        }
                        break;
                }
                
                if (imageUrl) {
                    console.log(`✅ Successfully generated image with ${service}`);
                    return imageUrl;
                }
            } catch (error) {
                console.error(`❌ Error with ${service}:`, error.message);
                lastError = error;
            }
        }

        // No fallback services - return null if all configured services fail
        console.warn('⚠️ All configured image services failed.');
        return null;
    }

    // Check if we have enough context to start contextual generation
    canStartContextualGeneration() {
        const minImages = this.config.OLLAMA.CONTEXTUAL_GENERATION.MIN_IMAGES_BEFORE_START;
        return this.imagePrompts.length >= minImages && 
               this.config.OLLAMA.CONTEXTUAL_GENERATION.ENABLED &&
               this.ollamaAvailable;
    }

    // Get contextual generation interval
    getContextualInterval() {
        return this.config.OLLAMA.CONTEXTUAL_GENERATION.INTERVAL;
    }

    async generateWithLocalSD(prompt) {
        console.log('🎨 Using local Stable Diffusion...');
        const endpoint = `${this.config.LOCAL_SD.BASE_URL}/sdapi/v1/txt2img`;

        const payload = {
            "prompt": prompt,
            "negative_prompt": "blurry, bad art, low quality, text, watermark",
            "steps": 5, // Start with a smaller number of steps for a quick preview
            "width": 512,
            "height": 512,
            "cfg_scale": 7,
            "sampler_name": "Euler a"
        };

        console.log('🎨 Local SD generation starting (5 steps)...');
        try {
            // Generate the 15-step image in the background without waiting for it
            this._generateHighQualitySDInBackground(prompt);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Local SD API error (5 steps):', response.status, errorBody);
                throw new Error(`Local SD API error: ${response.status}`);
            }

            const data = await response.json();
            if (data.images && data.images[0]) {
                console.log('🖼️ Local SD 5-step image generated.');
                return `data:image/png;base64,${data.images[0]}`;
            } else {
                // This is a critical error case where the API gives 200 OK but no image.
                console.error('Local SD API returned 200 OK but no image data for 5-step generation.', data.info || '');
                throw new Error('Stable Diffusion returned an empty response.');
            }
        } catch (error) {
            console.warn('⚠️ Local SD generation failed (5 steps):', error);
            // Allow fallback to the next service
            throw new Error('Local SD generation failed.');
        }
    }

    // New method to handle background generation of the high-quality SD image
    _generateHighQualitySDInBackground(prompt) {
        (async () => {
            try {
                console.log('🎨 Starting background SD generation (15 steps)...');
                const endpoint = `${this.config.LOCAL_SD.BASE_URL}/sdapi/v1/txt2img`;
                const payload = {
                    "prompt": prompt,
                    "negative_prompt": "blurry, bad art, low quality, text, watermark",
                    "steps": 15,
                    "width": 512,
                    "height": 512,
                    "cfg_scale": 7,
                    "sampler_name": "Euler a"
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error('Local SD API error (15 steps):', response.status, errorBody);
                    return; // Don't add a broken image
                }

                const data = await response.json();
                if (data.images && data.images[0] && this.addImageCallback) {
                    const imageUrl = `data:image/png;base64,${data.images[0]}`;
                    console.log('🖼️ Adding high-quality 15-step SD image to board.');
                    this.addImageCallback(imageUrl, `(15 Steps) ${prompt}`);
                } else {
                     console.warn('⚠️ Background SD generation (15 steps) returned 200 OK but no image data.', data.info || '');
                }
            } catch (error) {
                console.warn('⚠️ Background SD generation (15 steps) failed:', error);
            }
        })();
    }

    async generateWithSora(prompt) {
        if (!this.config.SORA.ENABLED) {
            return null;
        }
        // Note: This is a conceptual implementation as Sora API might have different endpoints
        // For now, we'll use a hypothetical Sora API structure
        const response = await fetch(`${this.config.SORA.BASE_URL}/generate/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.SORA.API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.SORA.MODEL,
                prompt: prompt.substring(0, this.config.APP.MAX_PROMPT_LENGTH),
                resolution: this.config.SORA.RESOLUTION,
                style: this.config.SORA.STYLE,
                duration: 0, // 0 for single frame/image instead of video
                output_format: 'image/jpeg'
            }),
        });

        if (!response.ok) {
            throw new Error(`Sora API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        // The exact response structure will depend on Sora's actual API
        if (data.images && data.images.length > 0) {
            return data.images[0].url;
        } else if (data.url) {
            return data.url;
        } else if (data.image_url) {
            return data.image_url;
        }
        
        throw new Error('No image generated by Sora');
    }

    async generateWithDALLE(prompt, isRetry = false) {
        console.log('🎨 DALL-E generation starting...');
        console.log('📝 Original prompt:', prompt);
        console.log('🔄 Is retry:', isRetry);
        
        console.log('🔑 API Key available:', !!(this.config.OPENAI.API_KEY && this.config.OPENAI.API_KEY !== 'your-openai-api-key-here'));
        console.log('🔑 API Key starts with:', this.config.OPENAI.API_KEY?.substring(0, 10) + '...');
        console.log('🤖 Model:', this.config.OPENAI.IMAGE_MODEL);
        console.log('📏 Max prompt length:', this.config.APP.MAX_PROMPT_LENGTH);
        
        // Validate API key
        if (!this.config.OPENAI.API_KEY || this.config.OPENAI.API_KEY === 'your-openai-api-key-here') {
            throw new Error('OpenAI API key not configured. Please add your API key to config.js');
        }
        
        // Validate and truncate prompt
        const truncatedPrompt = prompt.substring(0, this.config.APP.MAX_PROMPT_LENGTH);
        console.log('✂️ Truncated prompt:', truncatedPrompt);
        console.log('📊 Prompt length:', truncatedPrompt.length);
        
        const requestBody = {
            model: this.config.OPENAI.IMAGE_MODEL,
            prompt: truncatedPrompt,
            size: this.config.OPENAI.IMAGE_SIZE,
            n: 1,
        };

        // Only add quality and style for DALL-E 3
        if (this.config.OPENAI.IMAGE_MODEL === 'dall-e-3') {
            console.log('🎨 Using DALL-E 3 with quality and style parameters');
            requestBody.quality = this.config.OPENAI.IMAGE_QUALITY;
            requestBody.style = this.config.OPENAI.IMAGE_STYLE;
        } else {
            console.log('🎨 Using DALL-E 2 (no quality/style parameters)');
        }
        
        console.log('📦 Final request body to be sent to OpenAI:');
        console.log('📦 Model:', requestBody.model);
        console.log('📦 Prompt:', requestBody.prompt);
        console.log('📦 Prompt length:', requestBody.prompt.length);
        console.log('📦 Size:', requestBody.size);
        console.log('📦 Full request body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.OPENAI.API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response statusText:', response.statusText);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorData;
                let errorText;
                
                try {
                    errorText = await response.text();
                    console.log('🔍 Raw error response text:', errorText);
                    console.log('🔍 Error response length:', errorText.length);
                    
                    // Try to parse as JSON
                    errorData = JSON.parse(errorText);
                    console.log('🔍 Parsed error data:', JSON.stringify(errorData, null, 2));
                } catch (parseError) {
                    console.log('❌ Failed to parse error response as JSON');
                    console.log('❌ Parse error:', parseError.message);
                    console.log('❌ Raw text:', errorText);
                    throw new Error(`OpenAI API error: ${response.status} - Unable to parse response: ${errorText?.substring(0, 200) || 'No response text'}`);
                }
                
                console.log('🔍 Parsed error data:', errorData);
                console.log('🔍 Error data type:', typeof errorData);
                console.log('🔍 Error data keys:', Object.keys(errorData || {}));
                
                // Provide specific error messages based on the error type
                if (errorData && errorData.error) {
                    const error = errorData.error;
                    console.log('🔍 Error object:', error);
                    console.log('🔍 Error message:', error.message);
                    console.log('🔍 Error code:', error.code);
                    console.log('🔍 Error type:', error.type);
                    
                    let specificMessage = `${error.message || 'Unknown error'}`;
                    
                    // Handle specific OpenAI error types
                    if (error.type === 'image_generation_user_error') {
                        specificMessage = 'Content policy violation: The prompt was rejected by OpenAI\'s safety filters.';
                        specificMessage += '\n\n💡 This usually happens when:';
                        specificMessage += '\n• The prompt mentions specific people, characters, or copyrighted content';
                        specificMessage += '\n• There are references that could be interpreted as inappropriate';
                        specificMessage += '\n• The prompt is ambiguous in a way that triggers safety filters';
                        
                        // Suggest an alternative prompt
                        const cleanPrompt = this.sanitizePrompt(truncatedPrompt);
                        if (cleanPrompt !== truncatedPrompt) {
                            specificMessage += `\n\n✨ Suggested alternative: "${cleanPrompt}"`;
                            
                            // Auto-retry with sanitized prompt if this is not already a retry
                            if (!isRetry) {
                                console.log('🔄 Auto-retrying with sanitized prompt:', cleanPrompt);
                                try {
                                    return await this.generateWithDALLE(cleanPrompt, true);
                                } catch (retryError) {
                                    console.warn('🔄 Retry with sanitized prompt also failed:', retryError.message);
                                    specificMessage += '\n\n❌ Even the sanitized version was rejected. Please try a completely different description.';
                                }
                            }
                        }
                    } else if (error.code === 'invalid_request_error') {
                        if (error.message?.includes('prompt')) {
                            specificMessage += '\n\n💡 Prompt issue detected. Try:';
                            specificMessage += '\n• Using a shorter, simpler prompt';
                            specificMessage += '\n• Removing special characters or unusual formatting';
                            specificMessage += '\n• Checking for inappropriate content';
                        } else if (error.message?.includes('model')) {
                            specificMessage += '\n\n💡 Model issue detected. Check:';
                            specificMessage += '\n• Your model name in config.js (should be "dall-e-2" or "dall-e-3")';
                            specificMessage += '\n• Your OpenAI account has access to the requested model';
                        } else if (error.message?.includes('parameter')) {
                            specificMessage += '\n\n💡 Parameter issue detected. Check:';
                            specificMessage += '\n• Image size (valid: 256x256, 512x512, 1024x1024 for DALL-E 2; 1024x1024, 1792x1024, 1024x1792 for DALL-E 3)';
                            specificMessage += '\n• Quality setting (only for DALL-E 3: "standard" or "hd")';
                            specificMessage += '\n• Style setting (only for DALL-E 3: "natural" or "vivid")';
                        }
                    } else if (error.code === 'rate_limit_exceeded') {
                        specificMessage += '\n\n💡 Rate limit exceeded. Try:';
                        specificMessage += '\n• Waiting a few minutes before trying again';
                        specificMessage += '\n• Speaking more slowly to avoid rapid requests';
                        specificMessage += '\n• Checking your OpenAI usage limits';
                    } else if (error.code === 'insufficient_quota') {
                        specificMessage += '\n\n💡 Quota exceeded. Check:';
                        specificMessage += '\n• Your OpenAI account balance';
                        specificMessage += '\n• Your usage limits and billing settings';
                        specificMessage += '\n• Consider upgrading your OpenAI plan';
                    }
                    
                    throw new Error(`OpenAI API error: ${response.status} - ${specificMessage}`);
                } else {
                    console.log('❌ No error object found in response');
                    console.log('❌ Full errorData:', JSON.stringify(errorData, null, 2));
                    throw new Error(`OpenAI API error: ${response.status} - ${errorText || 'Unknown error'}`);
                }
            }

            const data = await response.json();
            console.log('✅ Successful response:', data);
            
            if (!data.data || !data.data[0] || !data.data[0].url) {
                throw new Error('OpenAI returned invalid response format - no image URL found');
            }
            
            return data.data[0].url;
            
        } catch (fetchError) {
            if (fetchError.message.includes('OpenAI API error:')) {
                throw fetchError; // Re-throw our formatted error
            } else {
                console.error('🌐 Network error:', fetchError);
                throw new Error(`Network error calling OpenAI API: ${fetchError.message}. Check your internet connection.`);
            }
        }
    }

    // Removed HuggingFace integration for faster performance

    // Helper function to convert a Blob to a Data URL
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async generateWithReplicate(prompt) {
        if (!this.config.REPLICATE.ENABLED) {
            return null;
        }

        console.log('🎨 Using Replicate API...');
        
        // Add safety parameters to the prompt
        const safePrompt = `${prompt}, safe for work, family friendly, professional, artistic, tasteful`;
        const negativePrompt = "nsfw, inappropriate, offensive, explicit, adult content, nudity, violence, gore, disturbing content";

        try {
            const response = await fetch('/api/replicate/predictions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: this.config.REPLICATE.MODEL_VERSION,
                    input: {
                        prompt: safePrompt,
                        negative_prompt: negativePrompt,
                        num_inference_steps: 50,
                        guidance_scale: 7.5,
                        scheduler: "K_EULER",
                        num_outputs: 1,
                        width: 768,
                        height: 768,
                        safety_checker: this.config.REPLICATE.SAFETY_CHECKER
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Replicate API error: ${error.detail || response.statusText}`);
            }

            const prediction = await response.json();
            console.log('🔄 Prediction created:', prediction.id);

            // Poll for the result
            const result = await this.pollReplicatePrediction(prediction.id, 60, 'MEDIUM');
            if (result && result.output && result.output[0]) {
                return result.output[0];
            }
            throw new Error('No image generated');
        } catch (error) {
            console.error('⚠️ Replicate API call failed:', error);
            throw error;
        }
    }

    async pollReplicatePrediction(predictionId, maxAttempts = 60, quality = 'MEDIUM') {
        const baseInterval = quality === 'LOW' ? 150 : 500; // Much faster polling: 150ms for LOW, 500ms for others
        const maxWait = quality === 'LOW' ? 15000 : 60000; // Shorter timeout: 15s for LOW, 1min for others
        const actualMaxAttempts = Math.min(maxAttempts, Math.floor(maxWait / baseInterval));
        
        console.log(`🔄 Polling prediction ${predictionId} (max ${actualMaxAttempts} attempts, ${baseInterval}ms intervals)`);
        
        let stuckInStartingCount = 0;
        const maxStuckCount = 10; // If stuck in "starting" for 10 consecutive checks, abort
        
        for (let attempt = 1; attempt <= actualMaxAttempts; attempt++) {
            try {
                const response = await fetch(`http://localhost:3000/api/replicate/predictions/${predictionId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`🔄 Prediction status (${attempt}/${actualMaxAttempts}): ${data.status}`);
                
                // Track if stuck in starting status
                if (data.status === 'starting') {
                    stuckInStartingCount++;
                    if (stuckInStartingCount >= maxStuckCount) {
                        console.warn(`⚠️ Prediction stuck in 'starting' status for ${maxStuckCount} attempts. Aborting.`);
                        throw new Error('Prediction stuck in starting status - server may be overloaded');
                    }
                } else {
                    stuckInStartingCount = 0; // Reset counter
                }
                
                if (data.status === 'succeeded') {
                    if (data.output && data.output.length > 0 && data.output[0]) {
                        const imageUrl = data.output[0];
                        console.log(`✅ Prediction completed successfully! Image URL: ${imageUrl.substring(0, 50)}...`);
                        // Verify the URL is valid
                        if (typeof imageUrl === 'string' && imageUrl.length > 0) {
                            return imageUrl;
                        } else {
                            console.error('❌ Invalid image URL received:', imageUrl);
                            throw new Error('Prediction succeeded but returned invalid image URL');
                        }
                    } else {
                        console.error('❌ Prediction succeeded but no valid output:', data.output);
                        throw new Error('Prediction succeeded but no output received');
                    }
                } else if (data.status === 'failed') {
                    const errorMsg = data.error || 'Unknown error occurred';
                    console.error(`❌ Prediction failed: ${errorMsg}`);
                    
                    // Check for specific NSFW error and handle gracefully
                    if (errorMsg.includes('NSFW content detected') || errorMsg.includes('safety')) {
                        throw new Error('NSFW_DETECTED');
                    }
                    
                    throw new Error(`Prediction failed: ${errorMsg}`);
                } else if (data.status === 'canceled') {
                    throw new Error('Prediction was canceled');
                }
                
                // Log progress every 5 attempts for LOW quality, every 10 for others
                const logInterval = quality === 'LOW' ? 5 : 10;
                if (attempt % logInterval === 0) {
                    console.log(`⏳ Still waiting... (${attempt}/${actualMaxAttempts}) Status: ${data.status}`);
                }
                
                // Wait before next poll - shorter for LOW quality
                await new Promise(resolve => setTimeout(resolve, baseInterval));
                
            } catch (error) {
                if (error.message.includes('NSFW_DETECTED')) {
                    throw error; // Re-throw NSFW errors
                }
                
                console.warn(`⚠️ Error during polling attempt ${attempt}:`, error);
                
                // For connection errors, wait a bit longer before retrying
                await new Promise(resolve => setTimeout(resolve, baseInterval * 2));
            }
        }
        
        throw new Error(`Prediction timed out after ${actualMaxAttempts} attempts (${maxWait/1000}s)`);
    }
    
    // Fallback when all else fails - create a placeholder with text
    createTextImagePlaceholder(text) {
        // Create a colored placeholder with the text
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Fill with a gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(1, '#50C878');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text to fit
        const maxWidth = 400;
        const lineHeight = 30;
        const words = text.split(' ');
        let line = '';
        let y = canvas.height / 2 - 50;
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, canvas.width / 2, y);
        
        // Add 'Image generation failed' text at bottom
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Image generation unavailable - placeholder shown', canvas.width / 2, y + 60);
        
        return canvas.toDataURL('image/png');
    }

    enhancePrompt(originalPrompt) {
        if (!this.config.APP.ENABLE_KEYWORD_ENHANCEMENT) {
            return originalPrompt;
        }

        // Add artistic enhancement keywords
        const styles = ['photorealistic', 'artistic', 'cinematic', 'detailed', 'high quality'];
        const lighting = ['soft lighting', 'dramatic lighting', 'golden hour', 'studio lighting'];
        const composition = ['rule of thirds', 'centered composition', 'dynamic angle'];
        
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomLighting = lighting[Math.floor(Math.random() * lighting.length)];
        
        return `${originalPrompt}, ${randomStyle}, ${randomLighting}, professional photography`;
    }

    // New and improved method to extract keywords using Ollama
    async extractKeywords(text) {
        if (!this.ollamaAvailable) {
            // Simple fallback if Ollama isn't running
            return text.split(' ').slice(0, 5).join(',');
        }
        try {
            const systemPrompt = `Extract the most important nouns and adjectives from the following text to use as search keywords. Return a short, comma-separated list of 3-5 keywords. Do not use any introductory text, just the keywords. Text: "${text}"`;
            const response = await fetch(`${this.config.OLLAMA.BASE_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.OLLAMA.FAST_MODEL || 'llama2',
                    prompt: systemPrompt,
                    stream: false,
                }),
            });
            if (!response.ok) return text;
            const data = await response.json();
            return data.response.trim();
        } catch (error) {
            console.warn('⚠️ Keyword extraction failed:', error);
            // Fallback to the original text on error
            return text;
        }
    }

    sanitizePrompt(prompt) {
        console.log('🧽 Starting sanitization of:', prompt);
        
        // First, check if the prompt is coherent enough to proceed
        if (!this.isCoherentPrompt(prompt)) {
            console.log('🚫 Prompt rejected as incoherent:', prompt);
            return this.generateFallbackPrompt();
        }
        
        // Simple cleanup - just remove obvious problematic terms
        let cleaned = prompt.toLowerCase().trim();
        
        // Remove only the most problematic terms, not everything
        const problematicTerms = [
            'friends', 'friend', 'celebrity', 'famous', 'actor', 'actress',
            'disney', 'marvel', 'batman', 'superman', 'pokemon',
            'waiting on', 'my friend', 'their friend'
        ];
        
        // Remove problematic terms
        problematicTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            cleaned = cleaned.replace(regex, '');
        });
        
        // Clean up extra spaces
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        // If the prompt is still reasonable, return it as-is
        if (cleaned.length > 5 && this.countWords(cleaned) >= 2) {
            console.log('✅ Lightly sanitized prompt:', cleaned);
            return cleaned;
        }
        
        // Only use fallback if the prompt is completely broken
        console.log('🔄 Using fallback after cleaning failed');
        return this.generateFallbackPrompt();
    }
    
    isCoherentPrompt(prompt) {
        const text = prompt.toLowerCase().trim();
        
        // Check minimum length
        if (text.length < 5) return false;
        
        // Check for minimum number of actual words (not just gibberish)
        const words = text.split(/\s+/).filter(word => word.length > 2);
        if (words.length < 2) return false;
        
        // Check for too many broken/incomplete words
        const brokenWords = text.match(/\b\w{1,2}\b/g) || [];
        if (brokenWords.length > words.length * 0.5) return false;
        
        // Check for incoherent patterns
        const incoherentPatterns = [
            /\b(the\s+the\s+the)\b/,  // Repeated articles
            /\b(and\s+and\s+and)\b/,  // Repeated conjunctions
            /\b\w{1}\s+\w{1}\s+\w{1}\b/, // Too many single letters
            /^\s*(um|uh|er|ah)\s+/,   // Speech fillers at start
        ];
        
        for (const pattern of incoherentPatterns) {
            if (pattern.test(text)) return false;
        }
        
        return true;
    }
    
    countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    createGenericPrompt(originalPrompt) {
        console.log('🎯 Creating generic version of:', originalPrompt);
        
        // For OpenAI, we need to be EXTREMELY conservative
        const text = originalPrompt.toLowerCase();
        
        // Ultra-safe mappings that should never trigger content policies
        const ultraSafeMap = {
            // Maritime/nautical
            'boat': 'water scene',
            'ship': 'water scene', 
            'nautical': 'water scene',
            'sailing': 'water scene',
            'marina': 'water scene',
            'harbor': 'water scene',
            'dock': 'water scene',
            'yacht': 'water scene',
            
            // Events/shows
            'show': 'scene',
            'event': 'scene',
            'exhibition': 'display',
            'competition': 'activity',
            'contest': 'activity',
            
            // Social
            'friends': 'figures',
            'friend': 'figure',
            'people': 'figures',
            'person': 'figure',
            'waiting': 'standing',
            'watching': 'viewing',
            
            // Generic safety
            'my': '',
            'the': '',
            'a': '',
            'an': ''
        };
        
        let safePrompt = originalPrompt;
        
        // Apply ultra-safe replacements
        for (const [risky, safe] of Object.entries(ultraSafeMap)) {
            const regex = new RegExp(`\\b${risky}\\b`, 'gi');
            safePrompt = safePrompt.replace(regex, safe);
        }
        
        // Clean up multiple spaces and empty words
        safePrompt = safePrompt.replace(/\s+/g, ' ').trim();
        
        // If still problematic or too short, use ultra-generic fallback
        if (safePrompt.length < 3 || this.containsProblematicTerms(safePrompt)) {
            // Create completely generic art prompt based on extracted colors/mood
            const colors = this.extractColors(text);
            const moods = this.extractMoods(text);
            
            if (colors.length > 0 && moods.length > 0) {
                safePrompt = `${colors[0]} ${moods[0]} abstract art`;
            } else if (colors.length > 0) {
                safePrompt = `${colors[0]} artistic composition`;
            } else if (moods.length > 0) {
                safePrompt = `${moods[0]} artistic scene`;
            } else {
                // Ultimate fallback - should NEVER be rejected
                safePrompt = 'colorful abstract art';
            }
        }
        
        console.log('✨ Ultra-safe prompt:', safePrompt);
        return safePrompt;
    }

    containsProblematicTerms(text) {
        const problematicTerms = [
            'topless', 'nude', 'naked', 'sexy', 'erotic', 'porn', 'hentai',
            'gore', 'blood', 'violence', 'kill', 'murder', 'hate speech'
        ];
        const lowerCaseText = text.toLowerCase();
        return problematicTerms.some(term => lowerCaseText.includes(term));
    }

    extractColors(text) {
        const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'white', 'black', 'golden', 'silver'];
        return colors.filter(color => text.includes(color));
    }

    extractMoods(text) {
        const moods = ['peaceful', 'calm', 'serene', 'vibrant', 'bright', 'soft', 'gentle', 'warm', 'cool', 'dreamy'];
        return moods.filter(mood => text.includes(mood));
    }

    async generateWithUnsplash(prompt) {
        try {
            const keywords = await this.extractKeywords(prompt);
            const url = `/unsplash/512x512/?${encodeURIComponent(keywords)}`;
            const response = await fetch(url);
            if (response.ok && response.url) {
                return response.url;
            }
        } catch (error) {
            console.warn('⚠️ Unsplash generation failed:', error);
        }
        // Throw an error to allow fallback to the next service
        throw new Error('Unsplash generation failed.');
    }

    createColoredPlaceholder(prompt) {
        // Extract color suggestions from prompt
        const colors = this.extractColors(prompt.toLowerCase());
        const defaultColors = ['#4A90E2', '#50C878', '#FF6B6B', '#FFD93D', '#A26BFF'];
        
        const color = colors.length > 0 ? this.getColorHex(colors[0]) : 
                     defaultColors[Math.floor(Math.random() * defaultColors.length)];
        
        // Create a simple SVG with the prompt text
        const svg = `
            <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${color}"/>
                <foreignObject x="50" y="400" width="924" height="224">
                    <div style="color: white; font-family: Arial, sans-serif; font-size: 48px; text-align: center; padding: 50px; background: rgba(0,0,0,0.3); border-radius: 20px;">
                        ${prompt}
                    </div>
                </foreignObject>
            </svg>
        `;
        
        const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
        console.log('🎨 Created colored placeholder for:', prompt);
        return dataUrl;
    }

    getColorHex(colorName) {
        const colorMap = {
            'blue': '#4A90E2',
            'red': '#FF6B6B',
            'green': '#50C878',
            'yellow': '#FFD93D',
            'purple': '#A26BFF',
            'orange': '#FF8C42',
            'pink': '#FFB6C1',
            'brown': '#8B4513',
            'gray': '#808080',
            'grey': '#808080',
            'black': '#2C3E50',
            'white': '#ECF0F1'
        };
        return colorMap[colorName] || '#4A90E2';
    }

    async generateContextualPrompt(recentPrompts) {
        try {
            // Use Ollama to generate a contextual prompt
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama2',
                    prompt: `Based on these recent image prompts: "${recentPrompts}", generate a new creative prompt that would complement them. The prompt should be artistic and descriptive.`,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.response) {
                return data.response.trim();
            }
            return null;
        } catch (error) {
            console.error('Error generating contextual prompt:', error);
            return null;
        }
    }

    // Add base64ToBlob function
    base64ToBlob(base64, type = 'image/png') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type });
    }

    async generateImageInBackground() {
        if (this.isGenerating) return;

        const randomPrompt = await this.generateContextualImage(this.imagePrompts);
        if (randomPrompt) {
            this.handleGenerate(randomPrompt);
        }
    }

    startAudioInput() {
        // Implementation for audio input
    }

    // Removed HuggingFace sentiment analysis for faster performance
    async analyzeSentiment(text) {
        // Simple local sentiment analysis based on keywords
        const positiveWords = ['happy', 'joy', 'beautiful', 'amazing', 'wonderful', 'great', 'awesome', 'love', 'good', 'fantastic'];
        const negativeWords = ['sad', 'angry', 'bad', 'terrible', 'awful', 'hate', 'disgusting', 'horrible', 'ugly', 'terrible'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        });
        
        const totalScore = positiveScore - negativeScore;
        const sentiment = totalScore > 0 ? 'POSITIVE' : totalScore < 0 ? 'NEGATIVE' : 'NEUTRAL';
        
        return [{
            label: sentiment,
            score: Math.abs(totalScore) / words.length || 0.5
        }];
    }

    getMoodHex(mood) {
        const moodColors = {
            "happy": "#FFD700", "sad": "#4682B4", "energetic": "#FF4500", "calm": "#87CEEB"
        };
        return moodColors[mood.toLowerCase()] || "#FFFFFF";
    }

    // New method to generate images from Picsum Photos (free)
    async generateWithPicsum(prompt) {
        console.log('🖼️ Generating image with Picsum Photos (free service)');
        // Extract a seed from the prompt to make the image somewhat related to the prompt
        const seed = this.hashString(prompt) % 1000;
        // Use a larger size for better quality
        const width = 800;
        const height = 600;
        
        // Use our server-side proxy instead of direct access
        const imageUrl = `/picsum/${seed}/${width}/${height}`;
        
        try {
            // No need to verify with a HEAD request, our proxy handles errors
            return imageUrl;
        } catch (error) {
            console.error('Picsum Photos generation failed:', error);
            throw new Error('Picsum Photos generation failed.');
        }
    }

    // Helper function to hash a string into a number (for Picsum seed)
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }


} 

