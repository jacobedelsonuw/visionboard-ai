import fetch from 'node-fetch';

async function testOllama() {
    console.log('Testing Ollama...');
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.2:1b',
                prompt: 'Enhance this image prompt: "red car" - make it more detailed and artistic',
                stream: false
            })
        });

        const data = await response.json();
        console.log('✅ Ollama response:', data.response);
        return data.response;
    } catch (error) {
        console.error('❌ Ollama error:', error.message);
        return null;
    }
}

async function testStableDiffusion(prompt) {
    console.log('Testing Stable Diffusion...');
    try {
        const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt || 'a beautiful red sports car, professional photography',
                steps: 15,
                width: 512,
                height: 512,
                cfg_scale: 7
            })
        });

        const data = await response.json();
        if (data.images && data.images.length > 0) {
            console.log('✅ Stable Diffusion generated image successfully');
            return true;
        } else {
            console.log('❌ No images generated');
            return false;
        }
    } catch (error) {
        console.error('❌ Stable Diffusion error:', error.message);
        return false;
    }
}

async function main() {
    console.log('🧪 Testing Local AI Services\n');
    
    // Test Ollama
    const enhancedPrompt = await testOllama();
    
    // Test Stable Diffusion
    await testStableDiffusion(enhancedPrompt);
    
    console.log('\n✅ Tests complete!');
}

main().catch(console.error); 