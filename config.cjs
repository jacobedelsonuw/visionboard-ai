module.exports = {
  REPLICATE: {
    ENABLED: true,
    API_KEY: process.env.REPLICATE_API_TOKEN || 'your_replicate_api_token_here',
    MODEL_VERSION: 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478',
    SAFETY_CHECKER: true
  },
  SERVICE_PRIORITY: ['REPLICATE', 'PICSUM'],
  // Add other server-side config here if needed
}; 