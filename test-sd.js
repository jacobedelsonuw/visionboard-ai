import fetch from 'node-fetch';
import fs from 'fs';

async function generateImage(prompt) {
    try {
        const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                steps: 20,
                width: 512,
                height: 512,
                cfg_scale: 7,
                sampler_name: 'DPM++ 2M Karras',
                negative_prompt: 'blurry, bad quality, distorted, deformed, low resolution, noise'
            })
        });

        const data = await response.json();
        
        // The response contains base64 encoded images
        if (data.images && data.images.length > 0) {
            // Save the first image
            const imageData = data.images[0];
            const buffer = Buffer.from(imageData, 'base64');
            fs.writeFileSync('generated-image.png', buffer);
            console.log('Image generated and saved as generated-image.png');
        } else {
            console.log('No images were generated');
        }
    } catch (error) {
        console.error('Error generating image:', error);
    }
}

// Test with a simple prompt
generateImage('a beautiful sunset over mountains, photorealistic, high quality'); 