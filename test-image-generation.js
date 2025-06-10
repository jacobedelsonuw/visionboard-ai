// Test script for image generation with Ollama and Stable Diffusion
// Uses model: llama3.2:1b (correct model name for your Ollama install)
import fetch from 'node-fetch';
import fs from 'fs';

async function enhancePromptWithOllama(prompt) {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2:1b',
                prompt: `Enhance this image prompt to be more detailed and artistic: "${prompt}". Respond with just the enhanced prompt, no explanation.`,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error('Error enhancing prompt with Ollama:', error);
        return prompt; // Fallback to original prompt
    }
}

async function generateImageWithSD(prompt) {
    try {
        const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                steps: 20,
                width: 512,
                height: 512,
                cfg_scale: 7,
                sampler_name: "DPM++ 2M Karras",
                negative_prompt: "blurry, bad quality, distorted, deformed"
            })
        });

        if (!response.ok) {
            throw new Error(`Stable Diffusion API error: ${response.status}`);
        }

        const data = await response.json();
        return data.images[0]; // Return the first generated image
    } catch (error) {
        console.error('Error generating image with Stable Diffusion:', error);
        throw error;
    }
}

async function main() {
    try {
        // Test prompt
        const originalPrompt = "a serene mountain landscape at sunset";
        console.log('Original prompt:', originalPrompt);

        // Enhance prompt with Ollama
        console.log('Enhancing prompt with Ollama...');
        const enhancedPrompt = await enhancePromptWithOllama(originalPrompt);
        console.log('Enhanced prompt:', enhancedPrompt);

        // Generate image with Stable Diffusion
        console.log('Generating image with Stable Diffusion...');
        const imageBase64 = await generateImageWithSD(enhancedPrompt);
        
        // Save the image
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        fs.writeFileSync('test-generated-image.png', imageBuffer);
        
        console.log('Image generated and saved as test-generated-image.png');
    } catch (error) {
        console.error('Error in main process:', error);
    }
}

main(); 