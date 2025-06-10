import fetch from 'node-fetch';
import fs from 'fs';

console.log('🎨 AI Image Generator');
console.log('Using Llama + Stable Diffusion\n');

// Get prompt from command line or use default
const prompt = process.argv.slice(2).join(' ') || 'a beautiful sunset over mountains';

console.log(`📝 Prompt: "${prompt}"`);

// Step 1: Enhance prompt with Ollama
console.log('\n🦙 Enhancing prompt with Llama...');
try {
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3.2:1b',
            prompt: `Enhance this image prompt for AI art generation: "${prompt}". Make it detailed and artistic. Respond with only the enhanced prompt.`,
            stream: false
        })
    });

    const ollamaData = await ollamaResponse.json();
    const enhancedPrompt = ollamaData.response.trim();
    console.log(`✨ Enhanced: "${enhancedPrompt.substring(0, 150)}..."`);

    // Step 2: Generate image with Stable Diffusion
    console.log('\n🎨 Generating image with Stable Diffusion...');
    const sdResponse = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: enhancedPrompt,
            steps: 25,
            width: 1024,
            height: 1024,
            cfg_scale: 7.5,
            sampler_name: 'DPM++ 2M Karras',
            negative_prompt: 'blurry, bad quality, distorted, deformed, low resolution'
        })
    });

    const sdData = await sdResponse.json();
    
    if (sdData.images && sdData.images.length > 0) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `ai-generated-${timestamp}.png`;
        
        const buffer = Buffer.from(sdData.images[0], 'base64');
        fs.writeFileSync(filename, buffer);
        
        console.log(`\n🎉 Success! Image saved as: ${filename}`);
        console.log(`🖼️  Open with: open "${filename}"`);
    } else {
        console.log('\n❌ No image was generated');
    }

} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure both services are running:');
    console.log('   - Ollama: ollama serve');
    console.log('   - Stable Diffusion: cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui && ./webui.sh --api --listen --port 7860');
} 