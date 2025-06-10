// Tone Analyzer for Mood Board - Detects emotional tone and style
class ToneAnalyzer {
    constructor() {
        this.tonePatterns = this.initializeTonePatterns();
        this.styleModifiers = this.initializeStyleModifiers();
    }

    initializeTonePatterns() {
        return {
            // Positive emotions
            joyful: {
                keywords: ['happy', 'joy', 'excited', 'delighted', 'cheerful', 'bright', 'sunny', 'fun', 'celebration', 'laugh', 'smile', 'wonderful', 'amazing', 'fantastic', 'great', 'awesome', 'beautiful', 'lovely', 'perfect', 'good', 'nice', 'cute', 'adorable', 'sweet'],
                emoji: '😊',
                intensity: 0.8,
                description: 'Bright, cheerful, and uplifting mood'
            },
            energetic: {
                keywords: ['energy', 'dynamic', 'powerful', 'intense', 'fast', 'rush', 'electric', 'explosive', 'vibrant', 'action', 'movement', 'speed', 'active', 'quick', 'rapid', 'strong', 'fierce', 'bold', 'alive'],
                emoji: '⚡',
                intensity: 0.9,
                description: 'High energy and dynamic feeling'
            },
            peaceful: {
                keywords: ['calm', 'peaceful', 'serene', 'tranquil', 'quiet', 'gentle', 'soft', 'relaxing', 'zen', 'meditation', 'still', 'silence', 'smooth', 'slow', 'rest', 'comfortable', 'easy'],
                emoji: '🕊️',
                intensity: 0.6,
                description: 'Calm, serene, and peaceful atmosphere'
            },
            romantic: {
                keywords: ['love', 'romantic', 'tender', 'intimate', 'heart', 'passion', 'kiss', 'embrace', 'couple', 'valentine', 'sweet', 'beautiful', 'gorgeous', 'stunning', 'elegant', 'graceful'],
                emoji: '💕',
                intensity: 0.7,
                description: 'Romantic and tender emotions'
            },

            // Negative emotions
            melancholy: {
                keywords: ['sad', 'melancholy', 'lonely', 'empty', 'lost', 'rain', 'gray', 'dark', 'shadow', 'tear', 'sorrow', 'blue', 'quiet', 'alone', 'distant', 'cold'],
                emoji: '😔',
                intensity: 0.7,
                description: 'Sad, contemplative, and introspective mood'
            },
            dramatic: {
                keywords: ['dramatic', 'intense', 'storm', 'thunder', 'lightning', 'crisis', 'conflict', 'tension', 'serious', 'grave', 'ominous', 'powerful', 'overwhelming', 'striking', 'bold'],
                emoji: '🎭',
                intensity: 0.8,
                description: 'Dramatic and intense atmosphere'
            },
            mysterious: {
                keywords: ['mystery', 'secret', 'hidden', 'dark', 'shadow', 'fog', 'mist', 'unknown', 'enigma', 'whisper', 'night', 'deep', 'strange', 'curious', 'puzzle'],
                emoji: '🔮',
                intensity: 0.6,
                description: 'Mysterious and enigmatic feeling'
            },

            // Complex emotions
            nostalgic: {
                keywords: ['memory', 'past', 'old', 'vintage', 'remember', 'childhood', 'history', 'nostalgia', 'yesterday', 'time', 'classic', 'retro', 'ancient', 'traditional'],
                emoji: '📸',
                intensity: 0.5,
                description: 'Nostalgic and reminiscent mood'
            },
            ethereal: {
                keywords: ['dream', 'ethereal', 'floating', 'cloud', 'heaven', 'angel', 'spirit', 'magical', 'surreal', 'fantasy', 'fairy', 'mystical', 'otherworldly', 'cosmic', 'divine'],
                emoji: '✨',
                intensity: 0.6,
                description: 'Dreamy, ethereal, and otherworldly'
            },
            rebellious: {
                keywords: ['rebel', 'punk', 'rock', 'wild', 'free', 'break', 'escape', 'revolution', 'chaos', 'bold', 'fierce', 'rough', 'edgy', 'raw', 'gritty'],
                emoji: '🔥',
                intensity: 0.8,
                description: 'Rebellious and fierce energy'
            },

            // Neutral/balanced
            contemplative: {
                keywords: ['think', 'wonder', 'contemplate', 'reflect', 'ponder', 'mind', 'thought', 'question', 'philosophy', 'study', 'focus', 'concentrate', 'consider'],
                emoji: '🤔',
                intensity: 0.4,
                description: 'Thoughtful and contemplative state'
            },
            minimalist: {
                keywords: ['simple', 'clean', 'minimal', 'pure', 'basic', 'essential', 'clear', 'space', 'empty', 'white', 'plain', 'neat', 'organized'],
                emoji: '⚪',
                intensity: 0.3,
                description: 'Clean, minimal, and simple aesthetic'
            }
        };
    }

    initializeStyleModifiers() {
        return {
            joyful: ['bright colors', 'warm lighting', 'cheerful atmosphere', 'vibrant', 'uplifting mood'],
            energetic: ['dynamic composition', 'bold colors', 'motion blur', 'high contrast', 'electric atmosphere'],
            peaceful: ['soft lighting', 'muted colors', 'gentle composition', 'serene atmosphere', 'calm mood'],
            romantic: ['warm tones', 'soft focus', 'golden hour lighting', 'tender atmosphere', 'intimate mood'],
            melancholy: ['muted colors', 'overcast lighting', 'somber mood', 'introspective atmosphere', 'blue tones'],
            dramatic: ['high contrast', 'dramatic lighting', 'intense shadows', 'stormy atmosphere', 'cinematic composition'],
            mysterious: ['low key lighting', 'deep shadows', 'fog effects', 'mysterious atmosphere', 'dark tones'],
            nostalgic: ['vintage filter', 'sepia tones', 'soft focus', 'aged appearance', 'retro aesthetic'],
            ethereal: ['soft lighting', 'dreamy atmosphere', 'floating elements', 'magical mood', 'luminous quality'],
            rebellious: ['high contrast', 'bold colors', 'gritty texture', 'urban aesthetic', 'raw energy'],
            contemplative: ['balanced composition', 'neutral tones', 'thoughtful mood', 'scholarly atmosphere'],
            minimalist: ['clean lines', 'negative space', 'minimal palette', 'simple composition', 'zen aesthetic']
        };
    }

    analyzeTone(text) {
        const lowercaseText = text.toLowerCase();
        const toneScores = {};

        // Calculate scores for each tone with improved sensitivity
        for (const [toneName, toneData] of Object.entries(this.tonePatterns)) {
            let score = 0;
            for (const keyword of toneData.keywords) {
                if (lowercaseText.includes(keyword)) {
                    // Give partial credit for word variations and context
                    score += 1;
                    
                    // Bonus for exact word matches
                    const words = lowercaseText.split(' ');
                    if (words.includes(keyword)) {
                        score += 0.5;
                    }
                }
            }
            
            // Weight by keyword frequency and base intensity
            toneScores[toneName] = score * toneData.intensity;
        }

        // Find the dominant tone
        const dominantTone = Object.keys(toneScores).reduce((a, b) => 
            toneScores[a] > toneScores[b] ? a : b
        );

        // Calculate overall intensity - more sensitive threshold
        const maxScore = Math.max(...Object.values(toneScores));
        const intensity = Math.min(maxScore / 2, 1); // Reduced from /3 to /2 for more sensitivity

        // Lower threshold for detecting non-neutral tones
        const primaryTone = toneScores[dominantTone] > 0.3 ? dominantTone : 'neutral'; // Reduced from >0 to >0.3
        
        if (primaryTone === 'neutral' || maxScore < 0.5) { // More specific neutral conditions
            // Try to detect subtle emotional indicators
            const emotionalWords = ['feel', 'looks', 'seems', 'appears', 'sounds', 'color', 'bright', 'dark', 'big', 'small', 'new', 'old'];
            let hasEmotionalContext = false;
            
            for (const word of emotionalWords) {
                if (lowercaseText.includes(word)) {
                    hasEmotionalContext = true;
                    break;
                }
            }
            
            // If there's emotional context, try to assign a default emotional tone
            if (hasEmotionalContext && text.length > 3) {
                // Assign based on general sentiment
                if (lowercaseText.includes('bright') || lowercaseText.includes('light') || lowercaseText.includes('warm')) {
                    return {
                        primary: 'Joyful',
                        secondary: null,
                        intensity: 0.4,
                        emoji: '😊',
                        description: 'Subtle positive energy detected',
                        confidence: 0.6
                    };
                } else if (lowercaseText.includes('dark') || lowercaseText.includes('cold') || lowercaseText.includes('gray')) {
                    return {
                        primary: 'Mysterious',
                        secondary: null,
                        intensity: 0.4,
                        emoji: '🔮',
                        description: 'Subtle mysterious atmosphere detected',
                        confidence: 0.6
                    };
                }
            }
            
            return {
                primary: 'Contemplative', // Changed from Neutral to Contemplative for more engaging default
                secondary: null,
                intensity: 0.3,
                emoji: '🤔',
                description: 'Thoughtful and reflective tone',
                confidence: 0.5
            };
        }

        const toneData = this.tonePatterns[primaryTone];
        
        // Find secondary tone with lower threshold
        const sortedTones = Object.entries(toneScores)
            .filter(([name]) => name !== primaryTone)
            .sort(([,a], [,b]) => b - a);
        
        const secondaryTone = sortedTones[0] && sortedTones[0][1] > 0.3 ? sortedTones[0][0] : null; // Reduced from >0.5

        return {
            primary: this.capitalize(primaryTone),
            secondary: secondaryTone ? this.capitalize(secondaryTone) : null,
            intensity: Math.max(0.4, intensity), // Minimum intensity for better visual feedback
            emoji: toneData.emoji,
            description: toneData.description,
            confidence: Math.min(Math.max(0.6, toneScores[primaryTone] / 1.5), 1) // Improved confidence calculation
        };
    }

    enhancePromptWithTone(originalPrompt, toneAnalysis) {
        if (toneAnalysis.primary === 'Neutral' || toneAnalysis.confidence < 0.3) {
            return originalPrompt;
        }

        const toneName = toneAnalysis.primary.toLowerCase();
        const modifiers = this.styleModifiers[toneName] || [];
        
        if (modifiers.length === 0) {
            return originalPrompt;
        }

        // Select modifiers based on intensity
        const numModifiers = Math.ceil(toneAnalysis.intensity * 3);
        const selectedModifiers = modifiers.slice(0, numModifiers);
        
        // Enhance the prompt
        const enhancedPrompt = `${originalPrompt}, ${selectedModifiers.join(', ')}, ${toneAnalysis.primary.toLowerCase()} mood`;
        
        return enhancedPrompt;
    }

    getToneColor(toneName) {
        const toneColors = {
            joyful: '#FFD700',      // Gold
            energetic: '#FF4500',   // Orange Red
            peaceful: '#87CEEB',    // Sky Blue
            romantic: '#FF69B4',    // Hot Pink
            melancholy: '#4682B4',  // Steel Blue
            dramatic: '#8B0000',    // Dark Red
            mysterious: '#483D8B',  // Dark Slate Blue
            nostalgic: '#DEB887',   // Burlywood
            ethereal: '#E6E6FA',    // Lavender
            rebellious: '#DC143C',  // Crimson
            contemplative: '#708090', // Slate Gray
            minimalist: '#F5F5F5',  // White Smoke
            neutral: '#808080'      // Gray
        };
        
        return toneColors[toneName.toLowerCase()] || toneColors.neutral;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Get tone statistics for export
    getToneStatistics(images) {
        const toneFrequency = {};
        const toneHistory = [];
        
        images.forEach(image => {
            if (image.tone && image.tone.primary !== 'Neutral') {
                const tone = image.tone.primary;
                toneFrequency[tone] = (toneFrequency[tone] || 0) + 1;
                toneHistory.push({
                    tone: tone,
                    timestamp: image.timestamp,
                    intensity: image.tone.intensity
                });
            }
        });
        
        return {
            frequency: toneFrequency,
            history: toneHistory,
            dominantTone: Object.keys(toneFrequency).reduce((a, b) => 
                toneFrequency[a] > toneFrequency[b] ? a : b, 'Neutral'
            )
        };
    }
}

// Initialize tone analyzer
const toneAnalyzer = new ToneAnalyzer(); 