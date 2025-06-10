#!/bin/bash

echo "🔍 Checking Stable Diffusion Installation Status..."
echo "=================================================="

# Check if the process is running
SD_PID=$(ps aux | grep "webui.sh\|launch.py" | grep -v grep | awk '{print $2}')

if [ ! -z "$SD_PID" ]; then
    echo "✅ Stable Diffusion process running (PID: $SD_PID)"
else
    echo "❌ Stable Diffusion process not found"
    echo "💡 You can start it manually with:"
    echo "   cd /Users/jacobedelson/AI-Tools/stable-diffusion-webui"
    echo "   ./webui.sh --api --listen --port 7860"
    exit 1
fi

# Check if API is responding
echo ""
echo "🌐 Testing API connection..."
if curl -s --max-time 5 http://localhost:7860/sdapi/v1/options > /dev/null 2>&1; then
    echo "✅ API is responding at http://localhost:7860"
    echo "🎨 Stable Diffusion is ready for image generation!"
    echo ""
    echo "🚀 You can now:"
    echo "   • Open your mood board app (index.html)"
    echo "   • Start speaking to generate AI images"
    echo "   • Visit http://localhost:7860 for the WebUI"
    exit 0
else
    echo "⏳ API not ready yet (still starting up...)"
    echo ""
    echo "📊 Installation progress:"
    
    # Check log file for progress indicators
    LOG_FILE="/Users/jacobedelson/AI-Tools/stable-diffusion-webui/webui.log"
    if [ -f "$LOG_FILE" ]; then
        echo "📋 Recent log entries:"
        tail -n 5 "$LOG_FILE" 2>/dev/null || echo "   (Log file not accessible)"
    else
        echo "   📋 Log file not found - installation in progress"
    fi
    
    # Check models directory
    MODELS_DIR="/Users/jacobedelson/AI-Tools/stable-diffusion-webui/models/Stable-diffusion"
    if [ -d "$MODELS_DIR" ]; then
        MODEL_COUNT=$(ls -1 "$MODELS_DIR"/*.ckpt "$MODELS_DIR"/*.safetensors 2>/dev/null | wc -l)
        if [ "$MODEL_COUNT" -gt 0 ]; then
            echo "✅ Models downloaded ($MODEL_COUNT found)"
        else
            echo "⏳ Models still downloading..."
        fi
    else
        echo "⏳ Models directory not created yet"
    fi
    
    # Check if we can connect to the port
    if nc -z localhost 7860 2>/dev/null; then
        echo "🔌 Port 7860 is open - WebUI starting up"
        echo "⏳ Wait 1-2 more minutes for full initialization"
    else
        echo "⏳ Port 7860 not open yet - still loading dependencies"
        echo "⏳ Wait 5-10 more minutes for initial setup"
    fi
    
    exit 1
fi 