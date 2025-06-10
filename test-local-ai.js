// Test script to verify local AI integration (Ollama + Stable Diffusion)
const CONFIG = require('./config.local.js');

class LocalAITester {
    constructor() {
        this.results = {
            ollama: { available: false, models: [] },
            stableDiffusion: { available: false, ready: false },
            integration: { working: false }
        };
    }

    async testOllama() {
        console.log('🦙 Testing Ollama availability...');
        try {
            const response = await fetch(`${CONFIG.OLLAMA.BASE_URL}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                this.results.ollama.available = true;
                this.results.ollama.models = data.models?.map(m => m.name) || [];
                console.log('✅ Ollama is available with models:', this.results.ollama.models);
                return true;
            }
        } catch (error) {
            console.log('❌ Ollama not available:', error.message);
        }
        return false;
    }

    async testStableDiffusion() {
        console.log('🖼️ Testing Stable Diffusion availability...');
        try {
            // Test basic connection
            const response = await fetch(`${CONFIG.LOCAL_SD.BASE_URL}/sdapi/v1/options`, {
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                this.results.stableDiffusion.available = true;
                console.log('✅ Stable Diffusion WebUI is responding');
                
                // Test image generation
                console.log('🎨 Testing image generation...');
                const testGeneration = await this.generateTestImage();
                this.results.stableDiffusion.ready = testGeneration;
                
                return testGeneration;
            }
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.log('⏳ Stable Diffusion is starting up (timeout after 5s)');
            } else {
                console.log('❌ Stable Diffusion not available:', error.message);
            }
        }
        return false;
    }

    async generateTestImage() {
        try {
            const response = await fetch(`${CONFIG.LOCAL_SD.BASE_URL}/sdapi/v1/txt2img`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: 'a simple red apple',
                    steps: 10, // Fast test
                    width: 512,
                    height: 512,
                    cfg_scale: 7
                }),
                signal: AbortSignal.timeout(30000) // 30 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                if (data.images && data.images.length > 0) {
                    console.log('✅ Test image generated successfully');
                    return true;
                } else {
                    console.log('❌ No image in response');
                    return false;
                }
            } else {
                console.log(`❌ Generation failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.log('⏳ Image generation timed out (taking longer than 30s)');
            } else {
                console.log('❌ Generation error:', error.message);
            }
            return false;
        }
    }

    async testIntegration() {
        console.log('🔄 Testing complete integration...');
        
        // Simulate the AI service workflow
        const testPrompt = 'beautiful sunset';
        let enhancedPrompt = testPrompt;
        
        // Test prompt enhancement with Ollama (if available)
        if (this.results.ollama.available) {
            try {
                console.log('🦙 Testing prompt enhancement...');
                const response = await fetch(`${CONFIG.OLLAMA.BASE_URL}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama3.2:1b',
                        prompt: `Enhance this image prompt with artistic details: "${testPrompt}". Respond with just the enhanced prompt:`,
                        stream: false,
                        options: { temperature: 0.7, num_predict: 50 }
                    }),
                    signal: AbortSignal.timeout(10000)
                });

                if (response.ok) {
                    const data = await response.json();
                    enhancedPrompt = data.response?.trim() || testPrompt;
                    console.log('✅ Prompt enhanced:', enhancedPrompt);
                }
            } catch (error) {
                console.log('⚠️ Prompt enhancement failed, using original');
            }
        }

        // Test image generation with enhanced prompt
        if (this.results.stableDiffusion.ready) {
            try {
                console.log('🎨 Testing with enhanced prompt...');
                const response = await fetch(`${CONFIG.LOCAL_SD.BASE_URL}/sdapi/v1/txt2img`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: enhancedPrompt,
                        negative_prompt: CONFIG.LOCAL_SD.NEGATIVE_PROMPT,
                        steps: 15,
                        width: 512,
                        height: 512,
                        cfg_scale: CONFIG.LOCAL_SD.CFG_SCALE
                    }),
                    signal: AbortSignal.timeout(45000)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.images && data.images.length > 0) {
                        console.log('✅ Full integration working!');
                        this.results.integration.working = true;
                        return true;
                    }
                }
            } catch (error) {
                console.log('❌ Integration test failed:', error.message);
            }
        }

        return false;
    }

    async runAllTests() {
        console.log('🚀 Starting Local AI Tests...');
        console.log('================================\n');

        // Test individual components
        await this.testOllama();
        console.log('');
        await this.testStableDiffusion();
        console.log('');
        
        // Test integration if both are available
        if (this.results.stableDiffusion.ready) {
            await this.testIntegration();
        }

        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log(`🦙 Ollama: ${this.results.ollama.available ? '✅ Available' : '❌ Not available'}`);
        if (this.results.ollama.available) {
            console.log(`   Models: ${this.results.ollama.models.join(', ')}`);
        }
        console.log(`🖼️ Stable Diffusion: ${this.results.stableDiffusion.available ? '✅ Available' : '❌ Not available'}`);
        console.log(`🎨 Image Generation: ${this.results.stableDiffusion.ready ? '✅ Ready' : '❌ Not ready'}`);
        console.log(`🔄 Full Integration: ${this.results.integration.working ? '✅ Working' : '❌ Not working'}`);

        console.log('\n🎯 Next Steps:');
        if (this.results.integration.working) {
            console.log('✅ Your AI-powered mood board is ready!');
            console.log('   • Open index.html');
            console.log('   • Start speaking to generate AI images');
            console.log('   • Images will be enhanced with Ollama and generated with Stable Diffusion');
        } else {
            if (!this.results.stableDiffusion.available) {
                console.log('⏳ Wait for Stable Diffusion to finish starting up');
                console.log('   • Check: ./check-sd-status.sh');
                console.log('   • Usually takes 5-15 minutes on first run');
            }
            if (!this.results.ollama.available) {
                console.log('💡 Consider installing Ollama for prompt enhancement');
                console.log('   • Download: https://ollama.ai');
                console.log('   • Install model: ollama pull llama3.2');
            }
        }

        return this.results.integration.working;
    }
}

// Run the tests
const tester = new LocalAITester();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
}); 