# 🎨 Local AI Image Generation with Llama + Stable Diffusion

This guide shows you how to use your local Llama model with Stable Diffusion to generate high-quality AI images with enhanced prompts.

## 🚀 What This System Does

1. **Prompt Enhancement**: Uses your local Llama model to transform simple prompts into detailed, artistic descriptions
2. **Image Generation**: Uses Stable Diffusion to create high-quality images from the enhanced prompts
3. **Local Processing**: Everything runs on your machine - no cloud APIs needed!

## 📋 Prerequisites

✅ **Already Set Up:**
- Ollama with Llama 3.2 model
- Stable Diffusion WebUI
- Node.js and required packages

## 🎯 Quick Start

### 1. Start the Services

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```

**Terminal 2 - Start Stable Diffusion:**
```bash
cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui
./webui.sh --api --listen --port 7860
```

### 2. Generate Images

**Simple Generation:**
```bash
node generate-image.js "your prompt here"
```

**Examples:**
```bash
# Fantasy scene
node generate-image.js "a dragon flying over a castle"

# Sci-fi scene  
node generate-image.js "a robot in a futuristic city"

# Nature scene
node generate-image.js "a peaceful forest lake"

# Abstract art
node generate-image.js "colorful geometric patterns"
```

## 🔄 How It Works

```
Your Prompt → Llama Enhancement → Stable Diffusion → Generated Image
```

### Example Transformation:

**Your Input:** `"red car"`

**Llama Enhancement:** 
> "A sleek, cherry-red sports car speeding down a winding mountain road at sunset. The vehicle is partially lit by the warm glow of the setting sun, casting long shadows across its curved body. Professional automotive photography, dramatic lighting, high detail."

**Result:** A stunning, detailed image instead of a basic car picture!

## 📁 Output

Generated images are saved as:
- `ai-generated-YYYY-MM-DDTHH-MM-SS.png`
- High resolution (1024x1024)
- Saved in your current directory

## ⚙️ Customization

### Modify Generation Settings

Edit `generate-image.js` to adjust:

```javascript
// Image quality settings
steps: 25,          // 15=fast, 25=balanced, 35=high quality
width: 1024,        // Image width
height: 1024,       // Image height
cfg_scale: 7.5,     // How closely to follow prompt (1-20)

// Sampler (affects style)
sampler_name: 'DPM++ 2M Karras'  // Try: 'Euler a', 'DPM++ SDE'
```

### Different Image Sizes

```javascript
// Square (default)
width: 1024, height: 1024

// Portrait  
width: 768, height: 1024

// Landscape
width: 1024, height: 768

// Wide
width: 1536, height: 768
```

## 🎨 Prompt Tips

### Good Prompts Include:
- **Subject**: What you want to see
- **Style**: Art style, photography type
- **Lighting**: Time of day, mood
- **Details**: Colors, textures, atmosphere

### Examples:

**Basic:** `"cat"`
**Enhanced:** `"a fluffy orange tabby cat sitting in a sunny window, soft natural lighting, cozy home atmosphere, professional pet photography"`

**Basic:** `"mountain"`  
**Enhanced:** `"majestic snow-capped mountain peak at sunrise, dramatic clouds, golden hour lighting, landscape photography, high detail"`

## 🛠️ Troubleshooting

### "Connection refused" errors:

**Check Ollama:**
```bash
curl http://localhost:11434/api/tags
# Should return JSON with your models
```

**Check Stable Diffusion:**
```bash
curl http://localhost:7860/sdapi/v1/options
# Should return JSON with settings
```

### Services Not Running:

**Start Ollama:**
```bash
ollama serve
```

**Start Stable Diffusion:**
```bash
cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui
./webui.sh --api --listen --port 7860
```

### Slow Generation:

- Reduce steps: `steps: 15`
- Smaller images: `width: 512, height: 512`
- Use faster sampler: `sampler_name: 'DPM++ SDE'`

### Out of Memory:

- Close other applications
- Reduce image size
- Use CPU mode: Add `--use-cpu all` to Stable Diffusion startup

## 📊 Performance Guide

### Generation Times (approximate):
- **Fast** (15 steps, 512x512): 5-10 seconds
- **Balanced** (25 steps, 1024x1024): 15-30 seconds  
- **High Quality** (35 steps, 1024x1024): 30-60 seconds

### Memory Usage:
- **Ollama**: ~2-4GB RAM
- **Stable Diffusion**: ~4-8GB RAM
- **Total System**: 8-12GB RAM recommended

## 🎯 Advanced Usage

### Batch Generation

Create multiple images at once:

```javascript
// Create batch-generate.js
const prompts = [
    "a magical forest",
    "a cyberpunk city", 
    "a peaceful beach"
];

for (const prompt of prompts) {
    // Run generation for each prompt
}
```

### Style Presets

Add style modifiers to your prompts:

```javascript
const styles = {
    photorealistic: ", photorealistic, high detail, professional photography",
    artistic: ", digital art, concept art, trending on artstation",
    anime: ", anime style, studio ghibli, cel shading",
    vintage: ", vintage photography, film grain, retro aesthetic"
};
```

## 🔧 Integration with Mood Board

Your existing mood board app can use this system:

1. **Speech Input** → Transcribed text
2. **Llama Enhancement** → Detailed prompt  
3. **Stable Diffusion** → Generated image
4. **Mood Board** → Display result

## 💡 Pro Tips

1. **Keep Services Running**: Leave Ollama and Stable Diffusion running for instant generation
2. **Experiment with Styles**: Try different artistic styles in your prompts
3. **Use Negative Prompts**: Specify what you DON'T want to see
4. **Save Good Prompts**: Keep a collection of prompts that work well
5. **Batch Process**: Generate multiple variations of the same concept

## 🎉 Example Workflow

```bash
# 1. Start services (in separate terminals)
ollama serve
cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui && ./webui.sh --api --listen --port 7860

# 2. Generate images
node generate-image.js "a cozy coffee shop"
node generate-image.js "a space station orbiting Earth"  
node generate-image.js "a medieval knight in armor"

# 3. View results
open ai-generated-*.png
```

## 📈 Next Steps

- **Experiment** with different prompts and styles
- **Integrate** with your mood board application
- **Create** custom scripts for specific use cases
- **Share** your best generated images!

---

🎨 **Happy Creating!** Your local AI image generation system is ready to bring your imagination to life! 