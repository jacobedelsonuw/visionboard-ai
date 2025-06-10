import LlamaImageGenerator from './llama-image-generator.js';

async function testIntegration() {
    const generator = new LlamaImageGenerator();
    try {
        console.log('Testing Ollama prompt enhancement...');
        const testPrompt = 'a beautiful sunset over mountains';
        const enhancedPrompt = await generator.enhancePrompt(testPrompt);
        console.log('Enhanced prompt:', enhancedPrompt);

        console.log('\nTesting Stable Diffusion image generation...');
        const imageResult = await generator.generateImage(enhancedPrompt);
        console.log('Image generation result:', imageResult);

        console.log('\nAll tests passed successfully!');
    } catch (error) {
        console.error('Integration test failed:', error);
    }
}

testIntegration(); 