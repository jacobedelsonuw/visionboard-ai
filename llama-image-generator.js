import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

class LlamaImageGenerator {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';
        this.stableDiffusionUrl = 'http://localhost:7860';
        this.ollamaModel = 'llama3.2:1b';
        this.outputDir = './generated-images';
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async checkServices() {
        console.log('🔍 Checking services...');
        
        // Check Ollama
        try {
            const ollamaResponse = await fetch(`${this.ollamaUrl}/api/tags`);
            if (ollamaResponse.ok) {
                console.log('✅ Ollama is running');
            }
        } catch (error) {
            console.log('❌ Ollama is not running. Start it with: ollama serve');
            return false;
        }

        // Check Stable Diffusion
        try {
            const sdResponse = await fetch(`${this.stableDiffusionUrl}/sdapi/v1/options`);
            if (sdResponse.ok) {
                console.log('✅ Stable Diffusion is running');
            }
        } catch (error) {
            console.log('❌ Stable Diffusion is not running. Start it from the webui directory.');
            return false;
        }

        return true;
    }

    async enhancePrompt(basicPrompt) {
        console.log(`🦙 Enhancing prompt with Ollama: "${basicPrompt}"`);
        
        const enhancementPrompt = `You are an expert at creating detailed, artistic image prompts for AI image generation. 
        
Take this basic prompt: "${basicPrompt}"

Transform it into a detailed, artistic prompt that will create a beautiful image. Include:
- Artistic style and technique
- Lighting and atmosphere
- Composition details
- Quality descriptors

Keep it under 150 words and focus on visual elements. Don't explain, just provide the enhanced prompt.`;

        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.ollamaModel,
                    prompt: enhancementPrompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        max_tokens: 150
                    }
                })
            });

            const data = await response.json();
            const enhancedPrompt = data.response.trim();
            console.log(`✨ Enhanced prompt: "${enhancedPrompt}"`);
            return enhancedPrompt;
        } catch (error) {
            console.error('Error enhancing prompt with Ollama:', error);
            console.log('📝 Using original prompt');
            return basicPrompt;
        }
    }

    async generateImage(prompt, filename = null) {
        console.log(`🎨 Generating image with Stable Diffusion...`);
        
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `generated-${timestamp}.png`;
        }

        try {
            const response = await fetch(`${this.stableDiffusionUrl}/sdapi/v1/txt2img`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    steps: 25,
                    width: 1024,
                    height: 1024,
                    cfg_scale: 7.5,
                    sampler_name: 'DPM++ 2M Karras',
                    negative_prompt: 'blurry, bad quality, distorted, deformed, low resolution, noise, watermark, text, signature, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck'
                })
            });

            const data = await response.json();
            
            if (data.images && data.images.length > 0) {
                const imageData = data.images[0];
                const buffer = Buffer.from(imageData, 'base64');
                const filepath = path.join(this.outputDir, filename);
                fs.writeFileSync(filepath, buffer);
                console.log(`✅ Image saved: ${filepath}`);
                return filepath;
            } else {
                console.log('❌ No images were generated');
                return null;
            }
        } catch (error) {
            console.error('Error generating image:', error);
            return null;
        }
    }

    async generateFromPrompt(basicPrompt, useEnhancement = true) {
        console.log(`\n🚀 Starting image generation process...`);
        console.log(`📝 Original prompt: "${basicPrompt}"`);

        // Check if services are running
        const servicesReady = await this.checkServices();
        if (!servicesReady) {
            return null;
        }

        // Enhance prompt with Ollama if requested
        let finalPrompt = basicPrompt;
        if (useEnhancement) {
            finalPrompt = await this.enhancePrompt(basicPrompt);
        }

        // Generate image with Stable Diffusion
        const imagePath = await this.generateImage(finalPrompt);
        
        if (imagePath) {
            console.log(`\n🎉 Success! Image generated and saved.`);
            console.log(`📁 Location: ${imagePath}`);
            return imagePath;
        } else {
            console.log(`\n❌ Failed to generate image.`);
            return null;
        }
    }

    async generateMultiple(prompts, useEnhancement = true) {
        console.log(`\n🎨 Generating ${prompts.length} images...`);
        const results = [];

        for (let i = 0; i < prompts.length; i++) {
            console.log(`\n--- Image ${i + 1}/${prompts.length} ---`);
            const result = await this.generateFromPrompt(prompts[i], useEnhancement);
            results.push(result);
        }

        return results;
    }
}

// Example usage
async function main() {
    const generator = new LlamaImageGenerator();

    // Single image generation
    console.log('='.repeat(60));
    console.log('🎨 LLAMA + STABLE DIFFUSION IMAGE GENERATOR');
    console.log('='.repeat(60));

    // Test with a simple prompt
    await generator.generateFromPrompt('a majestic dragon flying over a medieval castle');

    // Test with multiple prompts
    const prompts = [
        'a serene forest lake at sunset',
        'a futuristic city with flying cars',
        'a cozy coffee shop in autumn'
    ];

    await generator.generateMultiple(prompts);

    console.log('\n✨ All done! Check the generated-images folder for your creations.');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default LlamaImageGenerator; 