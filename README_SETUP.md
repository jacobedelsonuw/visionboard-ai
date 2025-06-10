# Vision Board Setup Guide

## 🎯 Quick Setup for AI Image Generation

Your Vision Board app is now configured to use **Ollama** (local AI) for prompt enhancement and **HuggingFace** for free image generation, avoiding the OpenAI API issues.

### ✅ What's Already Done

- ✅ Ollama installed and running
- ✅ Llama 3.2 models downloaded (3B and 1B versions)
- ✅ App configured to prioritize local AI
- ✅ Robust fallback system implemented

### 🔑 Get Your Free HuggingFace API Key

1. **Sign up at HuggingFace** (if you don't have an account):
   - Go to: https://huggingface.co/join
   - Sign up with email or GitHub

2. **Get your free API token**:
   - Go to: https://huggingface.co/settings/tokens
   - Click "New token"
   - Name it "Vision Board"
   - Select "Read" access (sufficient for inference)
   - Copy the token (starts with `hf_`)

3. **Add the token to your config**:
   - Open `config.local.js`
   - Replace `'your-huggingface-api-key-here'` with your actual token
   - Save the file

### 🚀 How It Works Now

1. **Speech → Ollama Enhancement**: Your speech is enhanced by local Llama 3.2
2. **Enhanced Prompt → HuggingFace**: Generates images using free Stable Diffusion models
3. **Fallback Chain**: HuggingFace → Replicate → OpenAI (tries each if previous fails)

### 🎨 Benefits of This Setup

- **Free**: HuggingFace inference is free with generous limits
- **Fast**: Ollama runs locally for instant prompt enhancement
- **Reliable**: Multiple fallback services
- **Private**: Your speech processing happens locally
- **Quality**: Uses state-of-the-art models

### 🔧 Advanced Configuration

Edit `config.local.js` to customize:

```javascript
HUGGINGFACE: {
    API_KEY: 'hf_your_actual_token_here',
    MODEL: 'runwayml/stable-diffusion-v1-5', // Main model
    BACKUP_MODEL: 'stabilityai/stable-diffusion-2-1', // Fallback
}
```

### 🎤 Usage

1. **Start the app**: Open http://localhost:8000
2. **Click microphone** or type prompts
3. **Watch the magic**: Ollama enhances → HuggingFace generates
4. **Enjoy free AI art** with no API costs!

### 🔍 Troubleshooting

- **Ollama not working?** Run: `brew services restart ollama`
- **Models missing?** Run: `ollama pull llama3.2:1b`
- **HuggingFace errors?** Check your API token in config.local.js

### 🌟 Pro Tips

- Speak clearly for better prompt enhancement
- Use descriptive language (colors, moods, styles)
- The app learns from your context and suggests related images
- Local processing means your privacy is protected

---

**Next**: Add your HuggingFace API key and start creating amazing AI-generated mood boards! 🎨 