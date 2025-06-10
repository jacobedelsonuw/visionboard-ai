#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIImageCreator {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';
        this.stableDiffusionUrl = 'http://localhost:7860';
        this.ollamaModel = 'llama3.2:1b';
        this.outputDir = path.join(__dirname, 'ai-generated-images');
        
        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async checkServices() {
        let ollamaRunning = false;
        let sdRunning = false;

        // Check Ollama
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
            ollamaRunning = response.ok;
        } catch (error) {
            // Service not running
        }

        // Check Stable Diffusion
        try {
            const response = await fetch(`${this.stableDiffusionUrl}/sdapi/v1/options`, { timeout: 3000 });
            sdRunning = response.ok;
        } catch (error) {
            // Service not running
        }

        return { ollama: ollamaRunning, stableDiffusion: sdRunning };
    }

    async enhancePrompt(basicPrompt) {
        const enhancementPrompt = `You are an expert at creating detailed image prompts for AI art generation.

Transform this basic prompt: "${basicPrompt}"

Into a detailed, artistic prompt that includes:
- Visual style and artistic technique
- Lighting and atmosphere
- Composition and framing
- Quality and detail descriptors

Keep it concise but vivid. Focus only on visual elements. Respond with just the enhanced prompt, no explanation.`;

        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.ollamaModel,
                    prompt: enhancementPrompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 200
                    }
                })
            });

            const data = await response.json();
            return data.response.trim();
        } catch (error) {
            console.log('⚠️  Prompt enhancement failed, using original prompt');
            return basicPrompt;
        }
    }

    async generateImage(prompt, settings = {}) {
        const defaultSettings = {
            steps: 25,
            width: 1024,
            height: 1024,
            cfg_scale: 7.5,
            sampler_name: 'DPM++ 2M Karras',
            negative_prompt: 'blurry, bad quality, distorted, deformed, low resolution, noise, watermark, text, ugly, duplicate, extra fingers, mutated hands, poorly drawn face, bad anatomy, extra limbs'
        };

        const finalSettings = { ...defaultSettings, ...settings, prompt };

        try {
            const response = await fetch(`${this.stableDiffusionUrl}/sdapi/v1/txt2img`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalSettings)
            });

            const data = await response.json();
            
            if (data.images && data.images.length > 0) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const filename = `ai-image-${timestamp}.png`;
                const filepath = path.join(this.outputDir, filename);
                
                const buffer = Buffer.from(data.images[0], 'base64');
                fs.writeFileSync(filepath, buffer);
                
                return filepath;
            }
            return null;
        } catch (error) {
            console.error('Image generation failed:', error.message);
            return null;
        }
    }

    async createImage(prompt, options = {}) {
        const { enhance = true, quality = 'balanced', size = 'square' } = options;

        console.log('\n🎨 AI Image Creator');
        console.log('='.repeat(50));
        console.log(`📝 Original prompt: "${prompt}"`);

        // Check services
        console.log('\n🔍 Checking AI services...');
        const services = await this.checkServices();
        
        if (!services.stableDiffusion) {
            console.log('❌ Stable Diffusion is not running!');
            console.log('💡 Start it with: cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui && ./webui.sh --api --listen --port 7860');
            return null;
        }
        console.log('✅ Stable Diffusion is ready');

        if (!services.ollama && enhance) {
            console.log('⚠️  Ollama not running - skipping prompt enhancement');
            console.log('💡 Start it with: ollama serve');
        } else if (services.ollama) {
            console.log('✅ Ollama is ready');
        }

        // Enhance prompt if requested and available
        let finalPrompt = prompt;
        if (enhance && services.ollama) {
            console.log('\n🦙 Enhancing prompt with Llama...');
            finalPrompt = await this.enhancePrompt(prompt);
            console.log(`✨ Enhanced: "${finalPrompt.substring(0, 100)}${finalPrompt.length > 100 ? '...' : ''}"`);
        }

        // Set quality settings
        const qualitySettings = {
            fast: { steps: 15, width: 512, height: 512 },
            balanced: { steps: 25, width: 1024, height: 1024 },
            high: { steps: 35, width: 1024, height: 1024 }
        };

        const sizeSettings = {
            square: { width: 1024, height: 1024 },
            portrait: { width: 768, height: 1024 },
            landscape: { width: 1024, height: 768 },
            wide: { width: 1536, height: 768 }
        };

        const settings = {
            ...qualitySettings[quality],
            ...sizeSettings[size]
        };

        // Generate image
        console.log(`\n🎨 Generating ${quality} quality ${size} image...`);
        console.log(`⚙️  Settings: ${settings.steps} steps, ${settings.width}x${settings.height}`);
        
        const startTime = Date.now();
        const imagePath = await this.generateImage(finalPrompt, settings);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (imagePath) {
            console.log(`\n🎉 Success! Image created in ${duration}s`);
            console.log(`📁 Saved to: ${imagePath}`);
            console.log(`🖼️  Open with: open "${imagePath}"`);
            return imagePath;
        } else {
            console.log('\n❌ Failed to generate image');
            return null;
        }
    }

    async createMultiple(prompts, options = {}) {
        console.log(`\n🎨 Creating ${prompts.length} AI images...`);
        const results = [];

        for (let i = 0; i < prompts.length; i++) {
            console.log(`\n--- Image ${i + 1}/${prompts.length} ---`);
            const result = await this.createImage(prompts[i], options);
            results.push({ prompt: prompts[i], path: result });
        }

        const successful = results.filter(r => r.path).length;
        console.log(`\n✨ Completed! ${successful}/${prompts.length} images created successfully.`);
        
        return results;
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    const creator = new AIImageCreator();

    if (args.length === 0) {
        // Demo mode
        console.log('🎨 AI Image Creator Demo');
        console.log('Using Llama for prompt enhancement + Stable Diffusion for generation\n');

        const demoPrompts = [
            'a magical forest with glowing mushrooms',
            'a cyberpunk city at night',
            'a peaceful mountain lake at sunrise'
        ];

        await creator.createMultiple(demoPrompts, { quality: 'balanced', size: 'square' });
    } else {
        // Use provided prompt
        const prompt = args.join(' ');
        await creator.createImage(prompt, { quality: 'balanced', size: 'square' });
    }
}

// Export for use as module
export default AIImageCreator;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
} 