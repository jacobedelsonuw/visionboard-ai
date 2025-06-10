# VisionBoard 🎨

An intelligent, AI-powered mood board creator that generates stunning images based on your prompts and contextual understanding. VisionBoard combines multiple AI services to create dynamic, interconnected visual collections.

![VisionBoard Demo](https://img.shields.io/badge/Status-Active-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🚀 **Core Generation**
- **Text-to-Image**: Generate images from descriptive prompts
- **Progressive Quality**: LOW → HIGH → ENHANCED_HIGH quality progression
- **Multiple AI Services**: Replicate API + Local Stable Diffusion support
- **Service Toggle**: Switch between AI providers with one click

### 🧠 **Intelligent Generation**
- **Auto-Generate**: Continuously creates images based on previous generations (2-3 second intervals)
- **Contextual Generation**: Analyzes all previous images to create related content (1-2 second intervals)
- **Speed Control**: Adjustable generation speed (1-10 scale)
- **Smart Prompting**: AI-enhanced prompt enrichment

### 🔗 **Image Management** 
- **Visual Connections**: Link images together with animated connection lines
- **Generate Connected**: Create new images from combined connected image prompts
- **Delete Images**: Alt+click or button controls for easy removal
- **Generate Similar**: Create variations of existing images
- **Drag & Drop**: Repositionable images on the board

### 🎛️ **Advanced Controls**
- **Audio Input**: Voice-to-text prompt generation
- **Sentiment Analysis**: Real-time emotional analysis with emoji feedback
- **Export Options**: PowerPoint and Google Slides export
- **Large Canvas**: Expansive mood board (up to 2400px wide)
- **Real-time Stats**: Track images, contextual generations, and connections

### 🎨 **Visual Features**
- **Contextual Styling**: Blue borders and pulse animations for AI-generated content
- **Connection Lines**: Animated lines between linked images
- **Hover Controls**: Quick access to image management tools
- **Responsive Grid**: Auto-adjusting layout for different screen sizes
- **Modern UI**: Clean, intuitive interface with smooth animations

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Replicate API key (optional)
- Local Stable Diffusion setup (optional)

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/visionboard.git
   cd visionboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuration

### Environment Variables
```env
REPLICATE_API_TOKEN=your_replicate_token_here
STABILITY_API_KEY=your_stability_key_here
LOCAL_SD_URL=http://127.0.0.1:7860
```

### AI Service Priority
Configure in `config.js`:
```javascript
SERVICE_PRIORITY: ['REPLICATE', 'LOCAL_SD'] // or ['LOCAL_SD', 'REPLICATE']
```

## 🎯 Usage

### Basic Image Generation
1. Enter a descriptive prompt in the input field
2. Click "Generate" or press Enter
3. Watch as LOW → HIGH → ENHANCED_HIGH quality images appear

### Auto-Generation Mode
1. Toggle "Auto Generate" switch
2. Adjust speed slider (1-10)
3. System automatically creates images every 2-3 seconds based on previous content

### Contextual Generation
1. Enable "Contextual Generation" toggle
2. System analyzes all previous images
3. Generates related content every 1-2 seconds
4. Contextual images appear with blue borders and pulse animation

### Image Management
- **Connect Images**: Double-click or use 🔗 button
- **Delete Images**: Alt+click or use × button  
- **Generate Similar**: Click ⚡ button
- **Generate Connected**: Use "Generate Connected" button after linking images

### Voice Input
1. Enable "Audio Input" toggle
2. Speak your prompt
3. System automatically generates image from speech

## 🏗️ Architecture

### Core Components
- **TheVisionBoard**: Main application class
- **AIImageService**: Handles multiple AI providers
- **ExportService**: PowerPoint/Google Slides export
- **Server**: Express.js proxy server

### AI Integration
- **Replicate API**: Primary cloud-based generation
- **Local Stable Diffusion**: Local generation option
- **Ollama**: Prompt enhancement (when available)
- **HuggingFace**: Sentiment analysis

### File Structure
```
visionboard/
├── dist/                  # Built JavaScript bundles
├── styles.css            # Main stylesheet
├── script.js             # Core application logic
├── ai-service.js         # AI service integration
├── config.js             # Configuration settings
├── server.cjs            # Express server
├── index.html            # Main HTML file
└── package.json          # Dependencies
```

## 🚀 Performance Optimizations

- **Progressive Loading**: Images appear immediately at each quality level
- **Queue Management**: Efficient handling of multiple generations
- **Smart Polling**: Optimized API polling intervals
- **Connection Recovery**: Automatic retry on API failures
- **Memory Management**: Efficient image handling and cleanup

## 🔧 Advanced Features

### Speed Control Mapping
- **Speed 10**: 1-2 second intervals (ultra-fast)
- **Speed 5**: 2-3 second intervals (balanced)
- **Speed 1**: 3-4 second intervals (conservative)

### Quality Levels
- **LOW**: 256×256, 5 steps, 500ms polling
- **HIGH**: 768×1024, 50 steps, 1000ms polling  
- **ENHANCED_HIGH**: 768×1024, enhanced prompts, high quality

### Connection System
- Visual lines between connected images
- Combined prompt generation
- Animated connection indicators
- Group management capabilities

## 🎨 Customization

### Styling
Modify `styles.css` for visual customization:
- Board dimensions
- Color schemes
- Animation timings
- Grid layouts

### AI Parameters
Adjust in `ai-service.js`:
- Generation steps
- Image dimensions
- Guidance scales
- Polling intervals

## 🐛 Troubleshooting

### Common Issues
1. **NSFW Content Detected**: Try different, more specific prompts
2. **Generation Fails**: Check API keys and service status
3. **Slow Performance**: Reduce speed setting or check network
4. **Images Not Loading**: Verify proxy server is running

### Debug Mode
Enable console logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 Academic Project

This project was developed as part of the course project for **David McDonald's course**:
- **Course**: HCDE 548/HCDE 598 - Designing the AI Prototype: Prototyping & Engineering AI Driven Applications
- **Institution**: University of Washington (UW)
- **Focus**: Exploring AI-driven application development and prototyping methodologies

## 🙏 Acknowledgments

- [Replicate](https://replicate.com/) for AI image generation API
- [Stable Diffusion](https://stability.ai/) for local generation capabilities
- [HuggingFace](https://huggingface.co/) for sentiment analysis
- [Express.js](https://expressjs.com/) for server framework
- **David McDonald** and the HCDE program at University of Washington for course guidance and framework

## 📊 Stats & Metrics

- **Generation Speed**: 1-4 seconds per image
- **Supported Formats**: JPG, PNG, WebP
- **Max Board Size**: 2400px wide
- **Concurrent Generations**: Queue-based processing
- **AI Services**: 2+ integrated providers

---

**Built with ❤️ for creative minds who love AI-powered visual experiences** 