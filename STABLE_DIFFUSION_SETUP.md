# Local Stable Diffusion Setup Guide

This guide will help you set up local Stable Diffusion image generation for your AI-powered mood board creator.

## 🚀 Installation Status

- ✅ **Automatic1111 WebUI**: Installing in `/Users/jacobedelson/AI-Tools/stable-diffusion-webui/`
- ✅ **Configuration**: Updated `config.local.js` to use local SD as primary
- ⏳ **First Run**: Downloading models and dependencies (takes 10-20 minutes)

## 📋 Prerequisites

All prerequisites are already installed on your system:
- ✅ Python 3.9.6
- ✅ Git 2.39.5
- ✅ Homebrew

## 🔧 Installation Process

The installation is currently running in the background. Here's what's happening:

1. **Repository Clone**: ✅ Complete
2. **Dependencies Download**: ⏳ In progress (PyTorch, transformers, etc.)
3. **Model Download**: ⏳ Downloading Stable Diffusion 1.5 (~4GB)
4. **WebUI Start**: ⏳ Will start automatically

## 🌐 Access URLs

Once installation is complete, you can access:
- **WebUI Interface**: http://localhost:7860
- **API Endpoint**: http://localhost:7860/sdapi/v1/
- **Documentation**: http://localhost:7860/docs

## ⚙️ Configuration

Your mood board app is configured with these Stable Diffusion settings:

```javascript
LOCAL_SD: {
    ENABLED: true,
    BASE_URL: 'http://localhost:7860',
    MODEL: 'v1-5-pruned-emaonly.ckpt',
    STEPS: 20,               // Quality vs Speed (10-50)
    CFG_SCALE: 7,           // Prompt adherence (1-20)
    SAMPLER: 'DPM++ 2M Karras',
    WIDTH: 1024,            // Image dimensions
    HEIGHT: 1024,
    NEGATIVE_PROMPT: 'blurry, bad quality, distorted, deformed, low resolution, noise'
}
```

## 🎛️ Customization Options

### Quality Settings
- **Fast**: `STEPS: 10-15` (3-10 seconds per image)
- **Balanced**: `STEPS: 20-25` (10-20 seconds per image)
- **High Quality**: `STEPS: 30-50` (30-60 seconds per image)

### Image Sizes
- **Square**: `1024x1024` (recommended for mood boards)
- **Portrait**: `1024x1536`
- **Landscape**: `1536x1024`
- **Mobile**: `768x1024`

### Samplers (Speed vs Quality)
- **Fastest**: `DPM++ SDE Karras`
- **Balanced**: `DPM++ 2M Karras` (default)
- **Best Quality**: `DPM++ 2S a Karras`

## 🚦 Checking Installation Status

To check if Stable Diffusion is ready:

```bash
# Check if the process is running
curl -s http://localhost:7860/sdapi/v1/options | head -1

# If running, you should see JSON output
# If not running, you'll see connection error
```

## 🔍 Troubleshooting

### Installation Issues
```bash
cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui
./webui.sh --api --listen --port 7860
```

### Common Problems

**1. "Connection refused" error:**
- WebUI is still starting up (wait 2-5 minutes)
- Check logs: `tail -f /Users/jacobedelson/AI-Tools/stable-diffusion-webui/webui.log`

**2. "Model not found" error:**
- Model is still downloading
- Check models folder: `ls -la models/Stable-diffusion/`

**3. "Out of memory" error:**
- Reduce image size: `WIDTH: 512, HEIGHT: 512`
- Reduce steps: `STEPS: 15`
- Add `--lowvram` flag to startup

### Memory Optimization for Mac

For better performance on Mac:
```bash
# In the stable-diffusion-webui directory
echo 'export PYTORCH_ENABLE_MPS_FALLBACK=1' >> webui-user.sh
echo 'export COMMANDLINE_ARGS="--api --listen --port 7860 --use-cpu all"' >> webui-user.sh
```

## 🎨 Testing Generation

Once running, test with a simple prompt:
```bash
curl -X POST "http://localhost:7860/sdapi/v1/txt2img" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "a beautiful sunset over mountains",
       "steps": 20,
       "width": 512,
       "height": 512
     }'
```

## 🔄 Starting/Stopping

### Start Stable Diffusion:
```bash
cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui
./webui.sh --api --listen --port 7860
```

### Stop Stable Diffusion:
- Press `Ctrl+C` in the terminal
- Or close the terminal window

## 📊 Performance Expectations

On your Mac, expect:
- **Initial startup**: 2-5 minutes
- **Image generation**: 10-30 seconds per image
- **Memory usage**: 4-8GB RAM
- **Storage**: ~10-15GB for full installation

## 🎯 Integration with Mood Board

Once running, your mood board app will:
1. **Enhance prompts** with Ollama (if available)
2. **Generate images** with local Stable Diffusion
3. **Fallback** to Unsplash photos if SD fails
4. **Context analysis** for theme-based suggestions

## 🚀 Next Steps

1. **Wait for installation** to complete (~10-20 minutes)
2. **Test the WebUI** at http://localhost:7860
3. **Try your mood board app** - it should now generate AI images!
4. **Experiment with settings** in `config.local.js`

## 💡 Pro Tips

- **Keep WebUI running** in the background for instant generation
- **Use shorter prompts** for faster generation
- **Try different samplers** for varied artistic styles
- **Adjust CFG scale** for more/less creative interpretation
- **Use negative prompts** to avoid unwanted elements

Your local AI-powered mood board creator is almost ready! 🎨✨ 