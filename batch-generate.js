import fetch from 'node-fetch';
import fs from 'fs';

console.log('🎨 AI Batch Image Generator');
console.log('Using Llama + Stable Diffusion\n');

// Define your prompts here
const prompts = [
    'a magical forest with glowing mushrooms',
    'a cyberpunk city at night with neon lights',
    'a peaceful mountain lake at sunrise',
    'a cozy coffee shop in autumn',
    'a futuristic space station orbiting Earth'
];

console.log(`📝 Generating ${prompts.length} images...`);

async function enhancePrompt(prompt) {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2',
                prompt: `Enhance this image prompt for AI art generation: "${prompt}". Make it detailed and artistic. Respond with only the enhanced prompt.`,
                stream: false
            })
        });
        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.log(`⚠️  Enhancement failed for "${prompt}", using original`);
        return prompt;
    }
}

async function generateImage(prompt, index) {
    try {
        const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                steps: 25,
                width: 1024,
                height: 1024,
                cfg_scale: 7.5,
                sampler_name: 'DPM++ 2M Karras',
                negative_prompt: 'blurry, bad quality, distorted, deformed, low resolution'
            })
        });

        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
            const filename = `batch-${String(index + 1).padStart(2, '0')}-${Date.now()}.png`;
            const buffer = Buffer.from(data.images[0], 'base64');
            fs.writeFileSync(filename, buffer);
            return filename;
        }
        return null;
    } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error.message);
        return null;
    }
}

// Main batch processing
async function main() {
    const results = [];
    
    for (let i = 0; i < prompts.length; i++) {
        const originalPrompt = prompts[i];
        console.log(`\n--- Image ${i + 1}/${prompts.length} ---`);
        console.log(`📝 Original: "${originalPrompt}"`);
        
        // Enhance prompt
        console.log('🦙 Enhancing with Llama...');
        const enhancedPrompt = await enhancePrompt(originalPrompt);
        console.log(`✨ Enhanced: "${enhancedPrompt.substring(0, 100)}..."`);
        
        // Generate image
        console.log('🎨 Generating image...');
        const startTime = Date.now();
        const filename = await generateImage(enhancedPrompt, i);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (filename) {
            console.log(`✅ Success! Saved as: ${filename} (${duration}s)`);
            results.push({ prompt: originalPrompt, filename, success: true });
        } else {
            console.log(`❌ Failed to generate image ${i + 1}`);
            results.push({ prompt: originalPrompt, filename: null, success: false });
        }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Batch Generation Complete!`);
    console.log(`✅ Successfully generated: ${successful}/${prompts.length} images`);
    
    if (successful > 0) {
        console.log('\n📁 Generated files:');
        results.filter(r => r.success).forEach(r => {
            console.log(`   - ${r.filename}`);
        });
        
        console.log('\n🖼️  View all images:');
        console.log(`   open batch-*.png`);
    }
    
    if (successful < prompts.length) {
        console.log('\n💡 Some images failed to generate. Check that both services are running:');
        console.log('   - Ollama: ollama serve');
        console.log('   - Stable Diffusion: cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui && ./webui.sh --api --listen --port 7860');
    }
}

main().catch(console.error); 