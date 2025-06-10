// Export Service for Mood Board - PowerPoint & Google Slides
export class ExportService {
    constructor() {
        this.clusters = new Map();
        this.imageData = [];
    }

    // Analyze and cluster images based on their prompts and themes
    async clusterImages(images) {
        const clusters = new Map();
        
        for (const image of images) {
            const cluster = await this.determineCluster(image.prompt, image.isContextual);
            
            if (!clusters.has(cluster.id)) {
                clusters.set(cluster.id, {
                    id: cluster.id,
                    name: cluster.name,
                    color: cluster.color,
                    images: []
                });
            }
            
            clusters.get(cluster.id).images.push(image);
        }
        
        return clusters;
    }

    // Determine which cluster an image belongs to based on keywords and sentiment
    async determineCluster(prompt, isContextual) {
        const lowercasePrompt = prompt.toLowerCase();
        
        // Define cluster categories with keywords
        const clusterDefinitions = [
            {
                id: 'nature',
                name: 'Nature & Landscapes',
                color: '#4CAF50',
                keywords: ['nature', 'landscape', 'forest', 'mountain', 'ocean', 'sky', 'tree', 'flower', 'garden', 'sunset', 'sunrise', 'beach', 'river']
            },
            {
                id: 'people',
                name: 'People & Portraits',
                color: '#FF5722',
                keywords: ['person', 'people', 'portrait', 'face', 'human', 'man', 'woman', 'child', 'family', 'friend', 'smile', 'emotion']
            },
            {
                id: 'abstract',
                name: 'Abstract & Artistic',
                color: '#9C27B0',
                keywords: ['abstract', 'art', 'artistic', 'creative', 'design', 'pattern', 'geometric', 'surreal', 'dream', 'imagination', 'color', 'vibrant']
            },
            {
                id: 'urban',
                name: 'Urban & Architecture',
                color: '#2196F3',
                keywords: ['city', 'urban', 'building', 'architecture', 'street', 'modern', 'skyscraper', 'house', 'interior', 'room', 'home']
            },
            {
                id: 'objects',
                name: 'Objects & Still Life',
                color: '#FF9800',
                keywords: ['object', 'food', 'drink', 'car', 'technology', 'book', 'music', 'instrument', 'tool', 'furniture', 'decoration']
            }
        ];

        // Score each cluster based on keyword matches
        let bestCluster = clusterDefinitions[0];
        let bestScore = 0;

        for (const cluster of clusterDefinitions) {
            let score = 0;
            for (const keyword of cluster.keywords) {
                if (lowercasePrompt.includes(keyword)) {
                    score += 1;
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestCluster = cluster;
            }
        }

        // If no keywords match, use contextual clustering
        if (bestScore === 0) {
            if (isContextual) {
                bestCluster = clusterDefinitions[2]; // Abstract for contextual
            } else {
                bestCluster = clusterDefinitions[4]; // Objects as default
            }
        }

        return bestCluster;
    }

    // Generate PowerPoint presentation with clustered layout
    async generatePowerPoint(images) {
        // Check if PptxGenJS is loaded
        if (typeof window.PptxGenJS === 'undefined' && typeof PptxGenJS === 'undefined') {
            throw new Error('PowerPoint library not loaded. Please ensure pptxgenjs is included in the HTML.');
        }
        
        const pptx = new (window.PptxGenJS || PptxGenJS)();
        
        // Set presentation properties
        pptx.author = 'AI Mood Board Creator';
        pptx.company = 'AI Mood Board';
        pptx.subject = 'AI Generated Mood Board';
        pptx.title = 'My AI Mood Board';
        
        // Cluster images
        const clusters = await this.clusterImages(images);
        
        // Title slide
        const titleSlide = pptx.addSlide();
        titleSlide.background = { fill: '667eea' };
        
        titleSlide.addText('AI Mood Board', {
            x: 1, y: 2, w: 8, h: 1.5,
            fontSize: 44,
            bold: true,
            color: 'FFFFFF',
            align: 'center'
        });
        
        titleSlide.addText(`Generated on ${new Date().toLocaleDateString()}`, {
            x: 1, y: 4, w: 8, h: 0.5,
            fontSize: 18,
            color: 'FFFFFF',
            align: 'center'
        });
        
        titleSlide.addText(`${images.length} images in ${clusters.size} thematic clusters`, {
            x: 1, y: 4.8, w: 8, h: 0.5,
            fontSize: 16,
            color: 'FFFFFF',
            align: 'center'
        });

        // Overview slide
        const overviewSlide = pptx.addSlide();
        overviewSlide.addText('Mood Board Overview', {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 32,
            bold: true,
            color: '333333'
        });

        let overviewY = 1.5;
        for (const [clusterId, cluster] of clusters) {
            overviewSlide.addText(`• ${cluster.name}: ${cluster.images.length} images`, {
                x: 1, y: overviewY, w: 8, h: 0.5,
                fontSize: 18,
                color: cluster.color.replace('#', ''),
                bullet: true
            });
            overviewY += 0.7;
        }

        // Individual cluster slides
        for (const [clusterId, cluster] of clusters) {
            const slide = pptx.addSlide();
            
            // Cluster title
            slide.addText(cluster.name, {
                x: 0.5, y: 0.3, w: 9, h: 0.8,
                fontSize: 28,
                bold: true,
                color: cluster.color.replace('#', '')
            });

            // Calculate grid layout
            const maxImagesPerSlide = 6;
            const imagesToShow = cluster.images.slice(0, maxImagesPerSlide);
            const rows = Math.ceil(imagesToShow.length / 3);
            const cols = Math.min(3, imagesToShow.length);
            
            const imageWidth = 2.5;
            const imageHeight = 2;
            const startX = (10 - (cols * imageWidth + (cols - 1) * 0.3)) / 2;
            const startY = 1.5;

            let currentRow = 0;
            let currentCol = 0;

            for (let i = 0; i < imagesToShow.length; i++) {
                const image = imagesToShow[i];
                
                try {
                    // Convert image to base64
                    const base64Data = await this.imageToBase64(image.url);
                    
                    const x = startX + currentCol * (imageWidth + 0.3);
                    const y = startY + currentRow * (imageHeight + 0.5);
                    
                    slide.addImage({
                        data: base64Data,
                        x: x,
                        y: y,
                        w: imageWidth,
                        h: imageHeight
                    });

                    // Add caption below image
                    const caption = image.prompt.length > 40 ? 
                        image.prompt.substring(0, 37) + '...' : 
                        image.prompt;
                    
                    slide.addText(`"${caption}"`, {
                        x: x,
                        y: y + imageHeight + 0.1,
                        w: imageWidth,
                        h: 0.3,
                        fontSize: 10,
                        color: '666666',
                        align: 'center'
                    });

                    currentCol++;
                    if (currentCol >= cols) {
                        currentCol = 0;
                        currentRow++;
                    }

                } catch (error) {
                    console.warn('Failed to add image to PowerPoint:', error);
                }
                
                // Update progress
                const totalProgress = Array.from(clusters.values()).reduce((sum, c) => sum + c.images.length, 0);
                const currentProgress = Array.from(clusters.values())
                    .slice(0, Array.from(clusters.keys()).indexOf(clusterId))
                    .reduce((sum, c) => sum + c.images.length, 0) + i + 1;
                
                this.updateProgress((currentProgress / totalProgress) * 100);
            }
            
            // If there are more images, add a note
            if (cluster.images.length > maxImagesPerSlide) {
                slide.addText(`... and ${cluster.images.length - maxImagesPerSlide} more images in this cluster`, {
                    x: 1, y: 6.5, w: 8, h: 0.5,
                    fontSize: 12,
                    color: '999999',
                    align: 'center',
                    italic: true
                });
            }
        }

        return pptx;
    }

    // Generate Google Slides presentation
    async generateGoogleSlides(images) {
        // Create a basic HTML template that can be opened in Google Slides
        const clusters = await this.clusterImages(images);
        
        let slidesContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Mood Board - Import to Google Slides</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .slide { 
            background: white; 
            width: 800px; 
            height: 600px; 
            margin: 20px auto; 
            padding: 40px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            page-break-after: always;
        }
        .title-slide { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
        }
        .cluster-images { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin-top: 20px; 
        }
        .cluster-image { 
            text-align: center; 
        }
        .cluster-image img { 
            width: 200px; 
            height: 150px; 
            object-fit: cover; 
            border-radius: 8px; 
        }
        .cluster-image p { 
            font-size: 12px; 
            color: #666; 
            margin-top: 8px; 
        }
        h1 { font-size: 36px; margin-bottom: 20px; }
        h2 { color: #333; margin-bottom: 20px; }
        .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="instructions">
        <h3>🎞️ Google Slides Import Instructions</h3>
        <p>1. Copy this entire page (Ctrl+A, Ctrl+C)</p>
        <p>2. Go to <a href="https://docs.google.com/presentation" target="_blank">Google Slides</a></p>
        <p>3. Create a new presentation</p>
        <p>4. Paste the content and Google Slides will automatically create slides from this content</p>
    </div>

    <div class="slide title-slide">
        <h1>AI Mood Board</h1>
        <p style="font-size: 18px;">Generated on ${new Date().toLocaleDateString()}</p>
        <p style="font-size: 16px;">${images.length} images in ${clusters.size} thematic clusters</p>
    </div>

    <div class="slide">
        <h2>Mood Board Overview</h2>
        <ul style="font-size: 18px; line-height: 1.8;">
`;

        for (const [clusterId, cluster] of clusters) {
            slidesContent += `<li style="color: ${cluster.color}"><strong>${cluster.name}</strong>: ${cluster.images.length} images</li>`;
        }

        slidesContent += `
        </ul>
    </div>
`;

        // Add cluster slides
        for (const [clusterId, cluster] of clusters) {
            slidesContent += `
    <div class="slide">
        <h2 style="color: ${cluster.color}">${cluster.name}</h2>
        <div class="cluster-images">
`;
            
            const maxImages = Math.min(6, cluster.images.length);
            for (let i = 0; i < maxImages; i++) {
                const image = cluster.images[i];
                const caption = image.prompt.length > 40 ? 
                    image.prompt.substring(0, 37) + '...' : 
                    image.prompt;
                
                slidesContent += `
            <div class="cluster-image">
                <img src="${image.url}" alt="Generated image" />
                <p>"${caption}"</p>
            </div>
`;
            }
            
            slidesContent += `
        </div>
`;
            
            if (cluster.images.length > maxImages) {
                slidesContent += `<p style="text-align: center; color: #999; font-style: italic;">... and ${cluster.images.length - maxImages} more images in this cluster</p>`;
            }
            
            slidesContent += `
    </div>
`;
        }

        slidesContent += `
</body>
</html>`;

        // Open in new window for copy-paste to Google Slides
        const newWindow = window.open('', '_blank');
        newWindow.document.write(slidesContent);
        newWindow.document.close();
        
        return 'google-slides-opened';
    }

    // Convert image URL to base64 with CORS handling
    async imageToBase64(imageUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                // Try direct approach first
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        ctx.drawImage(img, 0, 0);
                        const base64 = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(base64);
                    } catch (error) {
                        console.warn('Canvas conversion failed, trying fetch approach:', error);
                        this.fetchImageAsBase64(imageUrl).then(resolve).catch(reject);
                    }
                };
                
                img.onerror = async () => {
                    console.warn('Direct image load failed, trying fetch approach');
                    try {
                        const base64 = await this.fetchImageAsBase64(imageUrl);
                        resolve(base64);
                    } catch (error) {
                        console.warn('Fetch approach failed, using placeholder');
                        resolve(this.getPlaceholderImage());
                    }
                };
                
                img.src = imageUrl;
                
            } catch (error) {
                console.warn('Image conversion failed completely, using placeholder:', error);
                resolve(this.getPlaceholderImage());
            }
        });
    }

    // Alternative fetch-based approach for CORS-restricted images
    async fetchImageAsBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
        } catch (error) {
            throw new Error(`Failed to fetch image: ${error.message}`);
        }
    }

    // Generate a placeholder image as base64
    getPlaceholderImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 400;
        canvas.height = 300;
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI Generated Image', 200, 140);
        
        ctx.font = '16px Arial';
        ctx.fillText('(Image could not be embedded)', 200, 170);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // Generate clustered image downloads
    async generateClusteredImages(images) {
        const clusters = await this.clusterImages(images);
        const zip = new JSZip();
        
        for (const [clusterId, cluster] of clusters) {
            const clusterFolder = zip.folder(cluster.name);
            
            for (let i = 0; i < cluster.images.length; i++) {
                const image = cluster.images[i];
                
                try {
                    // Fetch image as blob
                    const response = await fetch(image.url);
                    const blob = await response.blob();
                    
                    // Create filename with sanitized prompt
                    const sanitizedPrompt = image.prompt
                        .replace(/[^a-zA-Z0-9\s]/g, '')
                        .replace(/\s+/g, '_')
                        .substring(0, 30);
                    
                    const filename = `${i + 1}_${sanitizedPrompt}.jpg`;
                    clusterFolder.file(filename, blob);
                    
                    // Add metadata file
                    const metadata = {
                        prompt: image.prompt,
                        timestamp: image.timestamp,
                        isContextual: image.isContextual,
                        cluster: cluster.name
                    };
                    
                    clusterFolder.file(`${i + 1}_metadata.json`, JSON.stringify(metadata, null, 2));
                    
                } catch (error) {
                    console.warn('Failed to add image to cluster:', error);
                }
                
                // Update progress
                const totalImages = Array.from(clusters.values()).reduce((sum, c) => sum + c.images.length, 0);
                const currentIndex = Array.from(clusters.values())
                    .slice(0, Array.from(clusters.keys()).indexOf(clusterId))
                    .reduce((sum, c) => sum + c.images.length, 0) + i + 1;
                
                const progress = (currentIndex / totalImages) * 100;
                this.updateProgress(progress);
            }
            
            // Add cluster summary
            const summary = {
                clusterName: cluster.name,
                totalImages: cluster.images.length,
                generatedAt: new Date().toISOString(),
                themes: cluster.images.map(img => img.prompt)
            };
            
            clusterFolder.file('cluster_summary.json', JSON.stringify(summary, null, 2));
        }
        
        return zip.generateAsync({ type: 'blob' });
    }

    // Update progress indicator
    updateProgress(percentage) {
        const progressBar = document.getElementById('exportProgressBar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    // Main export function
    async export(type, images) {
        if (images.length === 0) {
            throw new Error('No images to export');
        }

        this.updateProgress(0);

        switch (type) {
            case 'powerpoint':
                const pptx = await this.generatePowerPoint(images);
                const filename = `AI_Mood_Board_${new Date().toISOString().split('T')[0]}.pptx`;
                await pptx.writeFile({ fileName: filename });
                break;

            case 'google-slides':
                await this.generateGoogleSlides(images);
                break;

            case 'clusters':
                const zip = await this.generateClusteredImages(images);
                const zipFilename = `mood_board_clusters_${new Date().toISOString().split('T')[0]}.zip`;
                this.downloadBlob(zip, zipFilename);
                break;

            case 'both':
                // Generate PowerPoint
                this.updateProgress(0);
                const pptxBoth = await this.generatePowerPoint(images);
                
                // Generate clusters
                this.updateProgress(50);
                const zipBoth = await this.generateClusteredImages(images);
                
                // Create combined zip
                const combinedZip = new JSZip();
                const pptxBlob = await pptxBoth.write({ outputType: 'blob' });
                combinedZip.file('mood_board.pptx', pptxBlob);
                combinedZip.file('clustered_images.zip', zipBoth);
                
                const combinedBlob = await combinedZip.generateAsync({ type: 'blob' });
                const combinedFilename = `mood_board_complete_${new Date().toISOString().split('T')[0]}.zip`;
                this.downloadBlob(combinedBlob, combinedFilename);
                break;

            default:
                throw new Error('Invalid export type');
        }

        this.updateProgress(100);
    }

    // Helper function to download blob
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize export service
const exportService = new ExportService(); 