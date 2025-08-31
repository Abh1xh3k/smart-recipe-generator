import imageRecognitionService from '../services/imageRecognitionService';

// Initialize Gemini for image recognition
export function initializeGeminiImageRecognition() {
  // Use hardcoded API key for now
  const apiKey = "AIzaSyAb2K0HUEY2b7lqcwE6qUrcxByxUN3D6ds";
  
  if (!apiKey) {
    console.warn('Gemini API key not found. Image recognition will use simulation mode.');
    return false;
  }

  try {
    imageRecognitionService.initialize(apiKey);
    console.log('✅ Gemini image recognition initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini image recognition:', error);
    return false;
  }
}

// Check if Gemini is available
export function isGeminiAvailable(): boolean {
  return imageRecognitionService.isGeminiAvailable();
}

// Get Gemini status for UI display
export function getGeminiStatus() {
  if (isGeminiAvailable()) {
    return {
      available: true,
      status: 'Connected',
      message: 'AI-powered image recognition is ready',
      icon: '🤖'
    };
  } else {
    return {
      available: false,
      status: 'Simulation Mode',
      message: 'Using simulated recognition (add GEMINI_API_KEY for real AI)',
      icon: '🎭'
    };
  }
}
