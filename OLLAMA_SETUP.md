# 🦙 Ollama Setup Guide for AI Mood Board Creator

This guide will help you set up Ollama to enhance your AI Mood Board Creator with local AI capabilities.

## What is Ollama?

Ollama is a tool that allows you to run large language models locally on your machine. With Ollama integration, your mood board creator will:

- 🧠 **Intelligently enhance prompts** using local AI models
- 🔒 **Keep your data private** (no cloud API calls for prompt enhancement)
- ⚡ **Work offline** for prompt processing
- 💰 **Save money** on API costs

## Installation Steps

### 1. Install Ollama (if not already installed)

Since you already have Ollama installed (we can see your key at `/usr/share/ollama/.ollama/id_ed25519.pub`), you can skip this step!

For others:
```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai/download
```

### 2. Start Ollama Service

```bash
# Start Ollama (if not already running)
ollama serve

# Or check if it's already running
ps aux | grep ollama
```

### 3. Download Recommended Models

Download models for prompt enhancement:

```bash
# Fast, efficient model (recommended)
ollama pull llama3.2

# Alternative models you can try:
ollama pull llama3.2:1b    # Smallest, fastest
ollama pull llama3.2:3b    # Balanced
ollama pull mistral        # Alternative good model
ollama pull phi3          # Microsoft's model

# For multimodal capabilities (optional)
ollama pull llava         # Can analyze images
```

### 4. Verify Installation

Test that Ollama is working:

```bash
# List installed models
ollama list

# Test a model
ollama run llama3.2 "Enhance this image prompt: sunset over mountains"
```

### 5. Configure the Application

Update your `config.js` or create `config.local.js`:

```javascript
const CONFIG = {
    OLLAMA: {
        BASE_URL: 'http://localhost:11434', // Default Ollama port
        MODEL: 'llama3.2',                 // Use your installed model
        ENHANCE_PROMPTS: true,              // Enable prompt enhancement
        MAX_TOKENS: 150,                    // Response length
        TEMPERATURE: 0.7,                   // Creativity level
    },
    // ... other settings
};
```

## How It Works

1. **Speech Recognition**: You speak into the microphone
2. **Pause Detection**: After 1 second of silence, processing begins
3. **Ollama Enhancement**: Your speech is sent to Ollama for enhancement
   - Example: "red car" → "A sleek red sports car, dynamic angle, professional automotive photography, dramatic lighting, high detail"
4. **Image Generation**: Enhanced prompt is sent to your configured image AI service
5. **Mood Board**: Generated image appears on your board

## Model Recommendations

### For Prompt Enhancement:

| Model | Size | Speed | Quality | Memory |
|-------|------|-------|---------|--------|
| `llama3.2:1b` | 1.3GB | ⚡⚡⚡ | ⭐⭐ | 2GB |
| `llama3.2:3b` | 2.0GB | ⚡⚡ | ⭐⭐⭐ | 4GB |
| `llama3.2` | 4.7GB | ⚡ | ⭐⭐⭐⭐ | 8GB |
| `mistral` | 4.1GB | ⚡ | ⭐⭐⭐⭐ | 8GB |

### For Image Analysis (Optional):

| Model | Purpose | Size |
|-------|---------|------|
| `llava` | View and describe images | 4.5GB |
| `llava:13b` | Better image understanding | 7.3GB |

## Configuration Options

### Basic Setup
```javascript
OLLAMA: {
    BASE_URL: 'http://localhost:11434',
    MODEL: 'llama3.2',
    ENHANCE_PROMPTS: true,
}
```

### Advanced Settings
```javascript
OLLAMA: {
    BASE_URL: 'http://localhost:11434',
    MODEL: 'llama3.2',
    ENHANCE_PROMPTS: true,
    MAX_TOKENS: 150,        // Longer responses
    TEMPERATURE: 0.7,       // 0.0 = consistent, 1.0 = creative
    IMAGE_MODEL: 'llava',   // For future image analysis features
}
```

## Troubleshooting

### Ollama Not Detected
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

### Model Not Found
```bash
# List available models
ollama list

# Pull the model specified in config
ollama pull llama3.2
```

### Port Issues
If Ollama runs on a different port, update your config:
```javascript
BASE_URL: 'http://localhost:YOUR_PORT'
```

### Performance Issues
- Use smaller models (`llama3.2:1b`) for faster responses
- Increase `MAX_TOKENS` for more detailed prompts
- Adjust `TEMPERATURE` for different creativity levels

## Example Enhancements

Here's what Ollama does to your prompts:

**Your speech**: "blue ocean"
**Ollama enhanced**: "Serene blue ocean with crystal clear turquoise waters, gentle waves, golden hour lighting, professional seascape photography, peaceful atmosphere, high definition"

**Your speech**: "happy dog"
**Ollama enhanced**: "Joyful golden retriever dog with bright eyes and tongue hanging out, running through green grass, natural lighting, pet portrait photography, shallow depth of field, heartwarming mood"

## Performance Tips

1. **Model Selection**: Start with `llama3.2:1b` for speed, upgrade to `llama3.2` for quality
2. **Memory**: Ensure you have enough RAM for your chosen model
3. **Temperature**: Use 0.5-0.8 for balanced creativity
4. **Max Tokens**: 100-200 tokens usually sufficient for image prompts

## Integration Benefits

With Ollama integration, your AI Mood Board Creator becomes:
- 🚀 **Faster**: Local processing eliminates API delays
- 🎯 **Smarter**: Better image prompts = better results
- 🔒 **Private**: Your speech stays on your machine
- 💰 **Cost-effective**: No API usage fees for prompt enhancement
- 🌐 **Offline capable**: Works without internet for enhancement

## Next Steps

1. ✅ Verify Ollama is running (`ollama list`)
2. ✅ Configure your model in `config.local.js`
3. ✅ Start the mood board creator
4. ✅ Look for "🦙 Ollama (Local)" in the status message
5. ✅ Begin speaking and watch enhanced prompts in console

Happy creating! 🎨 