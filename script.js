import { AIImageService } from './ai-service.js';
import { ExportService } from './export-service.js';

export class TheVisionBoard {
    constructor() {
        // Initialize services
        this.aiService = new AIImageService(window.CONFIG, (imageUrl, prompt) => {
            if (this) {
                this.addImageToBoard(imageUrl, prompt, true);
            }
        });
        this.exportService = new ExportService();
        
        // Initialize state variables
        this.isGenerating = false;
        this.autoGenerateEnabled = false;
        this.autoGenerateTimer = null;
        this.contextualGenerationEnabled = false;
        this.contextualTimer = null;
        this.lastContextualGeneration = null;
        this.generatedImages = [];
        this.contextHistory = [];
        this.maxContextLength = 5;
        this.recognition = null;
        this.isListening = false;
        this.generationQueue = [];
        this.currentZIndex = 10;
        
        // Initialize UI elements
        this.initializeUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup auto-generate toggle
        this.setupAutoGenerateToggle();
        
        // Start contextual generation
        this.startContextualGeneration();
        
        // Check network connection
        this.checkNetworkConnection();
        
        // Display AI status
        this.displayAIStatus();

        this.init();
    }

    initializeUI() {
        // Main UI elements
        this.moodBoard = document.getElementById('mood-board');
        this.promptInput = document.getElementById('prompt-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.autoGenerateToggle = document.getElementById('auto-generate-toggle');
        this.contextualToggle = document.getElementById('contextual-toggle');
        this.serviceToggle = document.getElementById('service-toggle');
        this.speedControl = document.getElementById('speed-control');
        this.exportBtn = document.getElementById('export-btn');
        this.statusText = document.getElementById('status-text');
        
        // Modal elements
        this.imageModal = document.getElementById('image-modal');
        this.modalImage = document.getElementById('modal-image');
        this.modalPrompt = document.getElementById('modal-prompt');
        this.modalClose = document.getElementById('modal-close');
        this.modalSave = document.getElementById('modal-save');
        this.modalRegenerate = document.getElementById('modal-regenerate');
        
        // Hide unused modal buttons
        if (this.modalSave) this.modalSave.style.display = 'none';
        if (this.modalRegenerate) this.modalRegenerate.style.display = 'none';

        // Set prompt to read-only
        if (this.modalPrompt) this.modalPrompt.readOnly = true;
        
        // Additional UI elements
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imageUploadInput = document.getElementById('imageUploadInput');
        this.clearBtn = document.getElementById('clearBtn');
        this.contextualBtn = document.getElementById('contextualBtn');
        this.similarBtn = document.getElementById('similarBtn');
        this.imageCountElement = document.getElementById('imageCount');
        this.contextualCountElement = document.getElementById('contextualCount');
        this.loading = document.getElementById('loading');
        this.exportLoading = document.getElementById('exportLoading');
        this.exportModal = document.getElementById('exportModal');
        this.connectionCountElement = document.getElementById('connectionCount');
        this.serviceStatusElement = document.getElementById('service-status');
        this.audioInputToggle = document.getElementById('audio-input-toggle');
        this.exportPowerPointBtn = document.getElementById('export-powerpoint-btn');
        this.exportSlidesBtn = document.getElementById('export-slides-btn');
        this.sentimentDisplay = document.getElementById('sentiment-display');
        this.generateConnectedBtn = document.getElementById('generate-connected-btn');
        // Pinterest elements removed - no longer needed
        // this.pinterestQuery = document.getElementById('pinterestQuery');
        // this.pinterestBtn = document.getElementById('pinterestBtn');
        
        // Create additional UI elements
        const toneDisplay = document.getElementById('toneDisplay');
        if (toneDisplay) {
            this.createToneDisplay(toneDisplay);
        }
        this.createImageModal();
        
        // Verify all required elements exist
        if (!this.moodBoard || !this.promptInput || !this.generateBtn || 
            !this.autoGenerateToggle || !this.speedControl || !this.contextualToggle || 
            !this.exportBtn || !this.statusText || !this.imageModal || 
            !this.modalImage || !this.modalPrompt || !this.modalClose || 
            !this.modalSave || !this.modalRegenerate) {
            console.error('Required UI elements not found');
            return;
        }
    }

    createToneDisplay(container) {
        if (!container) return;

        const tones = ['warm', 'cool', 'bright', 'dark', 'vibrant', 'muted'];
        const toneContainer = document.createElement('div');
        toneContainer.className = 'tone-container';

        tones.forEach(tone => {
            const toneButton = document.createElement('button');
            toneButton.className = 'tone-button';
            toneButton.dataset.tone = tone;
            toneButton.textContent = tone;
            toneButton.addEventListener('click', () => this.applyTone(tone));
            toneContainer.appendChild(toneButton);
        });

        container.appendChild(toneContainer);
    }

    async checkNetworkConnection() {
        try {
            // Test network connectivity
            const response = await fetch('https://www.google.com/favicon.ico', { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            console.log('✅ Network connection verified');
        } catch (error) {
            console.warn('⚠️ Network connectivity issue detected');
            this.showNetworkWarning();
        }
    }

    showNetworkWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'network-warning';
        warningDiv.innerHTML = `
            <div style="background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); 
                       border-radius: 8px; padding: 15px; margin: 10px 0; color: #e65100;">
                <strong>⚠️ Network connectivity issue detected</strong><br>
                Speech recognition requires an internet connection. Please check your connection before starting.
            </div>
        `;
        
        document.querySelector('.container').insertBefore(warningDiv, document.querySelector('.controls'));
        
        setTimeout(() => {
            warningDiv.remove();
        }, 8000);
    }

    async displayAIStatus() {
        // Wait a moment for AI service to check Ollama availability
        setTimeout(async () => {
            let statusMessage = 'AI Services: ';
            const services = [];
            
            if (this.aiService.ollamaAvailable) {
                services.push('🦙 Ollama (Local)');
            }
            
            if (window.CONFIG?.OPENAI?.API_KEY && window.CONFIG.OPENAI.API_KEY !== 'your-openai-api-key-here') {
                services.push('🎨 DALL-E');
            }
            
            if (window.CONFIG?.HUGGINGFACE?.API_KEY && window.CONFIG.HUGGINGFACE.API_KEY !== 'your-huggingface-api-key-here') {
                services.push('🤗 HuggingFace');
            }
            
            if (window.CONFIG?.REPLICATE?.API_KEY && window.CONFIG.REPLICATE.API_KEY !== 'your-replicate-api-key-here') {
                services.push('🔄 Replicate');
            }
            
            if (window.CONFIG?.LOCAL_SD?.ENABLED) {
                services.push('🖼️ Local SD');
            }
            
            if (services.length === 0) {
                services.push('�� Unsplash (Fallback)');
            }
            
            statusMessage += services.join(', ');
            
            // Create status message container
            const statusDiv = document.createElement('div');
            statusDiv.className = 'ai-status-message';
            statusDiv.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); 
                           border-radius: 8px; padding: 15px; margin: 10px 0; color: #2e7d32; font-size: 0.9rem;">
                    <strong>🤖 ${statusMessage}</strong>
                    ${this.aiService.ollamaAvailable ? '<br>💡 Using Ollama for intelligent prompt enhancement!' : ''}
                    <br>🔄 Contextual generation: Generate related images automatically
                </div>
            `;
            
            // Find the header element
            const header = document.querySelector('header');
            
            // Insert the status message at the beginning of the header
            if (header) {
                header.insertBefore(statusDiv, header.firstChild);
                
                // Remove after 5 seconds
                setTimeout(() => {
                    if (statusDiv.parentNode) {
                        statusDiv.remove();
                    }
                }, 5000);
            }
        }, 1000);
    }

    updateStatus(message, type = 'info') {
        if (this.statusText) {
            this.statusText.textContent = message;
            this.statusText.className = `status-text ${type}`;
            
            // Clear status after 5 seconds
            setTimeout(() => {
                if (this.statusText) {
                    this.statusText.textContent = '';
                    this.statusText.className = 'status-text';
                }
            }, 5000);
        }
    }

    setupEventListeners() {
        // Generate button click
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', () => {
                const prompt = this.promptInput?.value?.trim();
                if (prompt) {
                    this.handleGenerate(prompt);
                }
            });
        }

        // Enter key in prompt input
        if (this.promptInput) {
            this.promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const prompt = this.promptInput.value.trim();
                    if (prompt) {
                        this.handleGenerate(prompt);
                    }
                }
            });
        }

        // Auto-generate toggle
        if (this.autoGenerateToggle) {
            this.autoGenerateToggle.addEventListener('change', (e) => {
                this.autoGenerateEnabled = e.target.checked;
                if (this.autoGenerateEnabled) {
                    this.startAutoGeneration();
                } else {
                    this.stopAutoGeneration();
                }
            });
        }

        // Contextual toggle
        if (this.contextualToggle) {
            this.contextualToggle.addEventListener('change', (e) => {
                this.contextualGenerationEnabled = e.target.checked;
                if (this.contextualGenerationEnabled) {
                    this.startContextualGeneration();
                } else {
                    this.stopContextualGeneration();
                }
            });
        }

        // Service toggle (Replicate vs Stable Diffusion)
        if (this.serviceToggle) {
            this.serviceToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Use Stable Diffusion first
                    this.aiService.config.SERVICE_PRIORITY = ['LOCAL_SD', 'REPLICATE'];
                    this.updateStatus('Switched to Stable Diffusion (Local SD) priority', 'success');
                    if (this.serviceStatusElement) {
                        this.serviceStatusElement.textContent = 'Using: Stable Diffusion';
                        this.serviceStatusElement.style.color = '#28a745';
                    }
                    console.log('🔄 Service priority: LOCAL_SD first, then REPLICATE');
                } else {
                    // Use Replicate first (default)
                    this.aiService.config.SERVICE_PRIORITY = ['REPLICATE', 'LOCAL_SD'];
                    this.updateStatus('Switched to Replicate API priority', 'success');
                    if (this.serviceStatusElement) {
                        this.serviceStatusElement.textContent = 'Using: Replicate API';
                        this.serviceStatusElement.style.color = '#007bff';
                    }
                    console.log('🔄 Service priority: REPLICATE first, then LOCAL_SD');
                }
            });
        }

        // Speed control
        if (this.speedControl) {
            this.speedControl.addEventListener('input', (e) => {
                // Restart auto-generation with new speed
                if (this.autoGenerateEnabled) {
                    this.stopAutoGeneration();
                    this.startAutoGeneration();
                }
                
                // Restart contextual generation with new speed
                if (this.contextualGenerationEnabled) {
                    this.stopContextualGeneration();
                    this.contextualGenerationEnabled = true; // Keep it enabled
                    this.startContextualGeneration();
                }
            });
        }

        // Audio input toggle
        if (this.audioInputToggle) {
            this.audioInputToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startAudioInput();
                } else {
                    this.stopAudioInput();
                }
            });
        }

        // Export button
        if (this.exportBtn) {
            this.exportBtn.style.display = 'none'; // Hide old button
        }

        if (this.exportPowerPointBtn) {
            this.exportPowerPointBtn.addEventListener('click', () => {
                if (this.generatedImages.length === 0) {
                    this.updateStatus('Add some images before exporting.', 'error');
                    return;
                }
                this.exportService.export('powerpoint', this.generatedImages);
            });
        }

        if (this.exportSlidesBtn) {
            this.exportSlidesBtn.addEventListener('click', () => {
                if (this.generatedImages.length === 0) {
                    this.updateStatus('Add some images before exporting.', 'error');
                    return;
                }
                this.exportService.export('google-slides', this.generatedImages);
            });
        }

        // Generate connected images button
        if (this.generateConnectedBtn) {
            this.generateConnectedBtn.addEventListener('click', () => {
                this.generateFromConnectedImages();
            });
        }

        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.moodBoard.innerHTML = '';
                this.generatedImages = [];
                this.updateImageCount();
                this.updateContextualCount();
                this.updateConnectionCount();
            });
        }

        // Upload button
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.imageUploadInput.click());
        }

        if (this.imageUploadInput) {
            this.imageUploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.addImageToBoard(event.target.result, 'Uploaded Image');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Pinterest button - REMOVED
        /* Pinterest functionality removed
        if (this.pinterestBtn) {
            this.pinterestBtn.addEventListener('click', async () => {
                const query = this.pinterestQuery.value.trim();
                if (query) {
                    this.updateStatus('Searching Pinterest...');
                    try {
                        const imageUrl = await this.pinterestService.searchImage(query);
                        if (imageUrl) {
                            this.addImageToBoard(imageUrl, query);
                            this.updateStatus('Pinterest image added!');
                        } else {
                            this.updateStatus('No image found on Pinterest for that query.', 'error');
                        }
                    } catch (error) {
                        console.error('Pinterest search failed:', error);
                        this.updateStatus('Pinterest search failed.', 'error');
                    }
                }
            });
        }
        */
    }

    handleGenerate(prompt) {
        if (!prompt) return;

        this.contextHistory.push(prompt);
        this.generationQueue.push(prompt);
        this.updateStatus(`'${prompt}' added to queue. ${this.generationQueue.length} item(s) waiting.`);
        
        if(this.promptInput) {
            this.promptInput.value = '';
            this.promptInput.focus();
        }

        if (!this.isGenerating) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.generationQueue.length === 0) {
            this.isGenerating = false;
            this.updateStatus('');
            return;
        }

        this.isGenerating = true;
        const queueItem = this.generationQueue.shift();
        
        // Handle both string prompts and objects with metadata
        let prompt, isContextual = false;
        if (typeof queueItem === 'string') {
            prompt = queueItem;
            // Check if this is a contextual prompt based on its content
            isContextual = prompt.includes('Inspired by:');
        } else {
            prompt = queueItem.prompt;
            isContextual = queueItem.isContextual || false;
        }
        
        this.updateStatus(`Generating: ${prompt}...`);

        try {
            const imageUrl = await this.aiService.generateImage(prompt);
            this.addImageToBoard(imageUrl, prompt, isContextual);
        } catch (error) {
            console.error('Image generation failed:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
        }

        this.processQueue();
    }
    
    startContextualGeneration() {
        if (!this.contextualGenerationEnabled) return;
        
        // Very fast contextual generation - 1-3 seconds based on speed
        const speed = this.speedControl ? parseInt(this.speedControl.value) : 5;
        const interval = Math.max(1000, (11 - speed) * 200); // Maps 1-10 to 2000-1000ms
        
        console.log(`🕒 Starting contextual generation with ${interval/1000}s interval (speed: ${speed})`);
        
        this.contextualTimer = setInterval(() => {
            this.generateContextualImage();
        }, interval);
    }

    stopContextualGeneration() {
        this.contextualGenerationEnabled = false;
        if (this.contextualTimer) {
            clearInterval(this.contextualTimer);
            this.contextualTimer = null;
        }
    }

    async generateContextualImage() {
        if (!this.contextualGenerationEnabled || this.generatedImages.length === 0) return;
        
        // Only skip if there are more than 2 generations in queue
        if (this.generationQueue.length > 2) {
            console.log('🧠 Skipping contextual generation - queue too busy');
            return;
        }
        
        console.log('🧠 Generating contextual image based on all previous images...');
        
        // Use all previous image prompts as context
        const allPrompts = this.generatedImages.map(img => img.prompt).filter(p => p && p.trim());
        
        if (allPrompts.length === 0) {
            console.log('🧠 No prompts available for contextual generation');
            return;
        }

        // Create contextual prompt by combining elements
        const randomPrompts = this.shuffleArray([...allPrompts]).slice(0, Math.min(3, allPrompts.length));
        const contextualPrompt = `Inspired by: ${randomPrompts.join(' and ')}, create something related but unique`;
        
        console.log(`🧠 Contextual prompt: "${contextualPrompt}"`);
        
        // Add to queue instead of blocking
        this.generationQueue.push(contextualPrompt);
        console.log(`🧠 Added contextual image to queue. Queue length: ${this.generationQueue.length}`);
        
        // Start processing if not already running
        if (!this.isGenerating) {
            this.processQueue();
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    addImageToBoard(imageUrl, prompt, isContextual = false) {
        if (!imageUrl || !this.moodBoard) {
            console.error('Invalid image URL or mood board element');
            this.updateStatus('Failed to add image.', 'error');
            return;
        }

        const moodItem = document.createElement('div');
        moodItem.className = 'mood-item';
        
        // Add contextual class if this is a contextual image
        if (isContextual) {
            moodItem.classList.add('contextual-image');
        }

        // Add unique ID for tracking
        const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        moodItem.setAttribute('data-image-id', imageId);

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = prompt || 'Generated Image';
        img.onerror = () => {
            console.error(`Failed to load image: ${imageUrl}`);
            this.updateStatus('An image failed to load.', 'error');
            
            // Create a colored box placeholder instead of using placeholder.jpg
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            
            // Generate a color based on the prompt
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Image Failed to Load', canvas.width/2, canvas.height/2 - 10);
            ctx.fillText(prompt || 'Generated Image', canvas.width/2, canvas.height/2 + 10);
            
            img.src = canvas.toDataURL();
        };

        // Create image controls overlay
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        controls.innerHTML = `
            <button class="control-btn delete-btn" title="Delete image">×</button>
            <button class="control-btn connect-btn" title="Connect/Disconnect for generation">🔗</button>
            <button class="control-btn generate-btn" title="Generate similar image">⚡</button>
        `;

        // Add event listeners for controls
        const deleteBtn = controls.querySelector('.delete-btn');
        const connectBtn = controls.querySelector('.connect-btn');
        const generateBtn = controls.querySelector('.generate-btn');

        // Delete button with better event handling
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🗑️ Delete button clicked for image: ${imageId}`);
            this.deleteImage(imageId, moodItem);
        });

        // Connect button with better event handling
        connectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🔗 Connect button clicked for image: ${imageId}`);
            this.toggleImageConnection(imageId, moodItem);
        });

        // Generate similar button with better event handling
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`⚡ Generate similar clicked for prompt: "${prompt}"`);
            this.generateSimilarImage(prompt);
        });

        // Add single-click delete on image itself (Alt+click)
        img.addEventListener('click', (e) => {
            if (e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🗑️ Alt+click delete for image: ${imageId}`);
                this.deleteImage(imageId, moodItem);
            }
        });

        // Add double-click to toggle connection
        img.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🔗 Double-click connect for image: ${imageId}`);
            this.toggleImageConnection(imageId, moodItem);
        });

        moodItem.appendChild(img);
        moodItem.appendChild(controls);
        this.moodBoard.appendChild(moodItem);
        this.generatedImages.push({ id: imageId, url: imageUrl, prompt, isContextual, connected: false });
        this.enableDragAndDrop(moodItem);
        this.updateImageCount();
        this.updateContextualCount();
        this.drawConnectionLines(); // Update connection lines
    }

    updateImageCount() {
        if (this.imageCountElement) {
            this.imageCountElement.textContent = `Images: ${this.generatedImages.length}`;
        }
    }
    
    updateContextualCount() {
        if (this.contextualCountElement) {
            const contextualCount = this.generatedImages.filter(img => img.isContextual).length;
            this.contextualCountElement.textContent = `Contextual: ${contextualCount}`;
        }
    }
    
    enableDragAndDrop(element) {
        let isDragging = false;
        let offsetX, offsetY;
    
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            element.style.position = 'absolute';
            element.style.zIndex = ++this.currentZIndex;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.cursor = 'grabbing';
        });
    
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const boardRect = this.moodBoard.getBoundingClientRect();
                let x = e.clientX - offsetX - boardRect.left;
                let y = e.clientY - offsetY - boardRect.top;
    
                // Constrain to mood board boundaries
                x = Math.max(0, Math.min(x, boardRect.width - element.offsetWidth));
                y = Math.max(0, Math.min(y, boardRect.height - element.offsetHeight));
    
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
            }
        });
    
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'grab';
            }
        });
    }



    startAutoGeneration() {
        if (!this.autoGenerateEnabled) return;
        
        const speed = this.speedControl ? parseInt(this.speedControl.value) : 5;
        const interval = Math.max(2000, (11 - speed) * 300); // Maps 1-10 to 3000-2000ms (much faster)
        
        console.log(`🤖 Starting auto-generation with ${interval/1000}s interval (speed: ${speed})`);
        
        this.autoTimer = setInterval(() => {
            this.generateAutoImage();
        }, interval);
    }

    stopAutoGeneration() {
        this.autoGenerateEnabled = false;
        clearInterval(this.autoTimer);
    }

    async generateAutoImage() {
        if (!this.autoGenerateEnabled) return;
        
        // Only skip if there are more than 3 generations in queue
        if (this.generationQueue.length > 3) {
            console.log('🤖 Skipping auto-generation - queue too busy');
            return;
        }
        
        // Get all previous prompts from generated images
        const allPrompts = this.generatedImages.map(img => img.prompt).filter(p => p && p.trim());
        
        let autoPrompt;
        if (allPrompts.length === 0) {
            // If no previous images, generate a random prompt
            const randomPrompts = [
                'abstract art', 'nature landscape', 'futuristic city', 'ancient temple',
                'cosmic nebula', 'underwater scene', 'mountain vista', 'desert oasis',
                'steampunk machinery', 'ethereal forest', 'cyberpunk street', 'magical portal'
            ];
            autoPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
            console.log(`🤖 Auto-generating with random prompt: "${autoPrompt}"`);
        } else {
            // Create auto-generation prompt based on all previous prompts
            const shuffledPrompts = this.shuffleArray([...allPrompts]);
            const selectedPrompts = shuffledPrompts.slice(0, Math.min(2, shuffledPrompts.length));
            autoPrompt = `Inspired by: ${selectedPrompts.join(' and ')}, create something new and creative`;
            console.log(`🤖 Auto-generating based on previous images: "${autoPrompt}"`);
        }
        
        // Add to queue instead of blocking
        this.generationQueue.push(autoPrompt);
        console.log(`🤖 Added auto-generated prompt to queue. Queue length: ${this.generationQueue.length}`);
        
        // Start processing if not already running
        if (!this.isGenerating) {
            this.processQueue();
        }
    }

    startAudioInput() {
        if (!('webkitSpeechRecognition' in window)) {
            this.updateStatus('Speech recognition not supported.', 'error');
            return;
        }

        if (this.isListening) return;

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('Listening...', 'info');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            this.promptInput.value = finalTranscript + interimTranscript;

            if (finalTranscript.trim()) {
                this.handleGenerate(finalTranscript.trim());
                this.analyzeSentiment(finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            this.updateStatus(`Speech recognition error: ${event.error}`, 'error');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateStatus('');
        };

        this.recognition.start();
    }

    stopAudioInput() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    async analyzeSentiment(text) {
        const sentiment = await this.aiService.analyzeSentiment(text);
        if (sentiment && sentiment.length > 0 && sentiment[0].length > 0) {
            this.displaySentiment(sentiment[0][0]);
        }
    }

    displaySentiment(sentiment) {
        if (!this.sentimentDisplay) return;

        let emoji = '😐';
        if (sentiment.label === 'POSITIVE') {
            emoji = sentiment.score > 0.9 ? '😍' : '😊';
        } else if (sentiment.label === 'NEGATIVE') {
            emoji = sentiment.score > 0.9 ? '😡' : '😞';
        }
        this.sentimentDisplay.textContent = emoji;
    }

    createImageModal() {
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => {
                this.imageModal.style.display = 'none';
            });
        }
        window.addEventListener('click', (event) => {
            if (event.target === this.imageModal) {
                this.imageModal.style.display = 'none';
            }
        });
    }

    showImageModal(imageUrl, prompt) {
        if (this.imageModal) {
            this.modalImage.src = imageUrl;
            this.modalPrompt.value = prompt;
            this.imageModal.style.display = 'block';
        }
    }

    init() {
        // Implementation of init method
    }

    deleteImage(imageId, moodItem) {
        if (confirm('Are you sure you want to delete this image?')) {
            // Remove from DOM
            moodItem.remove();
            
            // Remove from data array
            this.generatedImages = this.generatedImages.filter(img => img.id !== imageId);
            
            // Update counters
            this.updateImageCount();
            this.updateContextualCount();
            
            console.log(`🗑️ Deleted image: ${imageId}`);
        }
    }

    toggleImageConnection(imageId, moodItem) {
        const imageData = this.generatedImages.find(img => img.id === imageId);
        if (!imageData) return;

        imageData.connected = !imageData.connected;
        
        // Update visual state
        const connectBtn = moodItem.querySelector('.connect-btn');
        
        if (imageData.connected) {
            moodItem.classList.add('connected-image');
            if (connectBtn) {
                connectBtn.textContent = '🔓'; // Show disconnect icon
                connectBtn.title = 'Disconnect from generation';
            }
            console.log(`🔗 Connected image: ${imageId}`);
            this.updateStatus(`Image connected! Use "Generate Connected" to combine.`, 'success');
        } else {
            moodItem.classList.remove('connected-image');
            if (connectBtn) {
                connectBtn.textContent = '🔗'; // Show connect icon
                connectBtn.title = 'Connect for generation';
            }
            console.log(`🔓 Disconnected image: ${imageId}`);
            this.updateStatus(`Image disconnected.`, 'info');
        }
        
        this.updateConnectionCount();
        this.drawConnectionLines(); // Redraw all connection lines
    }

    async generateSimilarImage(basePrompt) {
        if (this.isGenerating) {
            this.updateStatus('Already generating an image. Please wait...', 'warning');
            return;
        }

        const enhancedPrompt = `${basePrompt}, similar style, variations, artistic interpretation`;
        console.log(`⚡ Generating similar image based on: "${basePrompt}"`);
        
        await this.handleGenerate(enhancedPrompt);
    }

    async generateFromConnectedImages() {
        const connectedImages = this.generatedImages.filter(img => img.connected);
        
        if (connectedImages.length === 0) {
            this.updateStatus('No connected images found. Connect images first using the 🔗 button.', 'warning');
            return;
        }

        if (this.isGenerating) {
            this.updateStatus('Already generating an image. Please wait...', 'warning');
            return;
        }

        // Combine prompts from connected images
        const combinedPrompts = connectedImages.map(img => img.prompt).filter(p => p && p.trim());
        const combinedPrompt = combinedPrompts.join(', combined with ');
        
        console.log(`🔗 Generating image from ${connectedImages.length} connected images`);
        console.log(`📝 Combined prompt: "${combinedPrompt}"`);
        
        this.updateStatus(`Generating from ${connectedImages.length} connected images...`);
        await this.handleGenerate(combinedPrompt);
    }

    updateConnectionCount() {
        const connectedCount = this.generatedImages.filter(img => img.connected).length;
        if (this.connectionCountElement) {
            this.connectionCountElement.textContent = `Connected: ${connectedCount}`;
        }
    }

    drawConnectionLines() {
        // Remove existing connection lines
        const existingLines = document.querySelectorAll('.connection-line');
        existingLines.forEach(line => line.remove());

        const connectedImages = this.generatedImages.filter(img => img.connected);
        
        if (connectedImages.length < 2) return;

        // Create lines between connected images
        for (let i = 0; i < connectedImages.length; i++) {
            for (let j = i + 1; j < connectedImages.length; j++) {
                this.createConnectionLine(connectedImages[i].id, connectedImages[j].id);
            }
        }
    }

    createConnectionLine(imageId1, imageId2) {
        const img1 = document.querySelector(`[data-image-id="${imageId1}"]`);
        const img2 = document.querySelector(`[data-image-id="${imageId2}"]`);
        
        if (!img1 || !img2) return;

        const rect1 = img1.getBoundingClientRect();
        const rect2 = img2.getBoundingClientRect();
        const boardRect = this.moodBoard.getBoundingClientRect();

        const x1 = rect1.left + rect1.width/2 - boardRect.left;
        const y1 = rect1.top + rect1.height/2 - boardRect.top;
        const x2 = rect2.left + rect2.width/2 - boardRect.left;
        const y2 = rect2.top + rect2.height/2 - boardRect.top;

        const line = document.createElement('div');
        line.className = 'connection-line';
        
        const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
        
        line.style.cssText = `
            position: absolute;
            width: ${length}px;
            height: 3px;
            background: linear-gradient(90deg, #28a745, #20c997);
            transform: rotate(${angle}deg);
            transform-origin: left center;
            left: ${x1}px;
            top: ${y1}px;
            z-index: 1;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
            animation: connectionPulse 2s ease-in-out infinite alternate;
        `;
        
        this.moodBoard.appendChild(line);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const visionBoard = new TheVisionBoard();
    window.theVisionBoard = visionBoard; // Make it globally accessible for debugging
}); 