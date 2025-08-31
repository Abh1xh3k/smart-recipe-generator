'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Ingredient } from '../types';
import imageRecognitionService, { DetectedIngredient } from '../services/imageRecognitionService';

interface ImageIngredientRecognitionProps {
  onIngredientsDetected: (ingredients: Ingredient[]) => void;
  onClose: () => void;
}

export default function ImageIngredientRecognition({ onIngredientsDetected, onClose }: ImageIngredientRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      console.log('🔍 Checking camera permissions...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('❌ MediaDevices not supported');
        setHasCameraPermission(false);
        return false;
      }
      
      // Check if we already have permission
      if (navigator.permissions) {
        try {
          const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('📱 Camera permission state:', permissions.state);
          setHasCameraPermission(permissions.state === 'granted');
          return permissions.state === 'granted';
        } catch (permErr) {
          console.log('⚠️ Permissions API error, trying direct access:', permErr);
        }
      }
      
      // If permissions API not available or failed, try to get user media directly
      console.log('🎥 Attempting to access camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      console.log('✅ Camera access granted');
      stream.getTracks().forEach(track => track.stop());
      setHasCameraPermission(true);
      return true;
    } catch (err: any) {
      console.error('❌ Camera permission check failed:', err);
      setHasCameraPermission(false);
      return false;
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setError(null);
        setDetectedIngredients([]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the entire drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB');
        return;
      }
      
      // Show loading state
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setError(null);
        setDetectedIngredients([]);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file. Please try again.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setError('Please drop an image file (JPG, PNG, WebP)');
    }
  }, []);

  // Open camera
  const openCamera = useCallback(async () => {
    try {
      console.log('📸 Opening camera...');
      setIsProcessing(true);
      setError(null);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device');
      }

      console.log('🎥 Requesting camera access...');
      // Request camera permissions with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });
      
      console.log('✅ Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
        setError(null);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('🎬 Video metadata loaded, camera ready');
          setIsProcessing(false);
        };
        
        // Add error handling for video
        videoRef.current.onerror = (e) => {
          console.error('❌ Video error:', e);
          setError('Failed to load camera video. Please try again.');
          setIsProcessing(false);
        };
      } else {
        console.error('❌ Video ref not available');
        throw new Error('Video element not found');
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      setIsProcessing(false);
      
      // Provide specific error messages for different scenarios
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera is not supported on this device or browser.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Unable to access camera: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsProcessing(false);
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    console.log('📸 Capturing photo...');
    
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          // Get video dimensions
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          
          console.log('📏 Video dimensions:', videoWidth, 'x', videoHeight);
          
          if (videoWidth === 0 || videoHeight === 0) {
            console.log('⚠️ Camera not ready, dimensions are 0');
            setError('Camera not ready. Please wait a moment and try again.');
            return;
          }
          
          // Set canvas dimensions to match video
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          
          console.log('🎨 Canvas dimensions set:', canvasRef.current.width, 'x', canvasRef.current.height);
          
          // Draw video frame to canvas
          context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
          
          // Convert to base64 image
          const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
          console.log('🖼️ Photo captured, image data length:', imageData.length);
          
          setSelectedImage(imageData);
          closeCamera();
          setDetectedIngredients([]);
          setError(null);
        } else {
          console.error('❌ Failed to get canvas context');
          setError('Failed to capture photo. Please try again.');
        }
      } catch (err) {
        console.error('❌ Photo capture error:', err);
        setError('Failed to capture photo. Please try again.');
      }
    } else {
      console.error('❌ Video or canvas ref not available');
      setError('Camera not available. Please try again.');
    }
  }, [closeCamera]);

  // Check camera permissions on mount
  useEffect(() => {
    console.log('🚀 Component mounted, checking camera permissions...');
    checkCameraPermission();
  }, [checkCameraPermission]);

  // Process image with AI recognition
  const processImage = useCallback(async () => {
    if (!selectedImage) return;

    console.log('🖼️ Starting image processing...');
    console.log('📸 Selected image length:', selectedImage.length);
    
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔍 Checking Gemini availability...');
      const isGeminiAvailable = imageRecognitionService.isGeminiAvailable();
      console.log('🤖 Gemini available:', isGeminiAvailable);
      
      if (isGeminiAvailable) {
        console.log('🚀 Using Gemini AI for recognition...');
        const response = await imageRecognitionService.recognizeIngredients({
          imageData: selectedImage,
          maxResults: 10
        });
        console.log('✅ Gemini response received:', response);
        setDetectedIngredients(response.ingredients);
      } else {
        console.log('🎭 Gemini not available, using simulation...');
        const response = await imageRecognitionService.simulateRecognition({
          imageData: selectedImage,
          maxResults: 10
        });
        console.log('✅ Simulation response received:', response);
        setDetectedIngredients(response.ingredients);
      }
      
      console.log('🍅 Final detected ingredients:', detectedIngredients);
    } catch (err) {
      console.error('❌ Image recognition failed:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage]);

  // Add detected ingredients to the main form
  const addDetectedIngredients = useCallback(() => {
    const ingredients: Ingredient[] = detectedIngredients.map((detected, index) => ({
      id: `detected-${Date.now()}-${index}`,
      name: detected.name,
      category: detected.category || 'Vegetables', // Use detected category or default
      quantity: '1',
      unit: 'piece'
    }));

    onIngredientsDetected(ingredients);
    onClose();
  }, [detectedIngredients, onIngredientsDetected, onClose]);

  // Remove detected ingredient
  const removeDetectedIngredient = useCallback((index: number) => {
    setDetectedIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear selected image
  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setDetectedIngredients([]);
    setError(null);
  }, []);

  return (
    <Card 
      className={`w-full max-w-2xl mx-auto transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50 scale-[1.02]' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Image Ingredient Recognition
            </CardTitle>
            <CardDescription>
              Upload a photo or take a picture to automatically detect ingredients
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Drag and Drop Instructions */}
        {!selectedImage && !isCameraOpen && (
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Quick Upload</span>
            </div>
            <p className="text-sm text-blue-700">
              Drag and drop your ingredient images anywhere in this area, or use the buttons below
            </p>
          </div>
        )}
        
        {/* Image Input Methods */}
        {!selectedImage && !isCameraOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all duration-200 cursor-pointer rounded-lg ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`w-8 h-8 transition-colors duration-200 ${
                isDragOver ? 'text-blue-500' : 'text-slate-400'
              }`} />
              <span className={`font-medium transition-colors duration-200 ${
                isDragOver ? 'text-blue-600' : 'text-slate-600'
              }`}>
                {isDragOver ? 'Drop Image Here' : 'Upload Image'}
              </span>
              <span className={`text-xs transition-colors duration-200 ${
                isDragOver ? 'text-blue-500' : 'text-slate-500'
              }`}>
                {isDragOver ? 'Release to upload' : 'JPG, PNG up to 10MB'}
              </span>
              
              {/* Drag and drop hint */}
              <div className={`text-xs text-center px-3 py-1 rounded-full transition-all duration-200 ${
                isDragOver 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {isDragOver ? '🎯' : '📁'} Drag & drop or click to browse
              </div>
            </div>

            <Button
              onClick={() => {
                console.log('📱 Camera button clicked');
                console.log('🔍 Camera permission state:', hasCameraPermission);
                if (hasCameraPermission === false) {
                  console.log('🔐 Requesting camera permission...');
                  checkCameraPermission();
                } else {
                  console.log('📸 Opening camera...');
                  openCamera();
                }
              }}
              variant="outline"
              className={`h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed ${
                hasCameraPermission === false 
                  ? 'border-red-300 hover:border-red-400 hover:bg-red-400 hover:bg-red-50' 
                  : 'border-slate-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              <Camera className={`w-8 h-8 ${
                hasCameraPermission === false ? 'text-red-400' : 'text-slate-400'
              }`} />
              <span className={hasCameraPermission === false ? 'text-red-600' : 'text-slate-600'}>
                {hasCameraPermission === false ? 'Grant Camera Permission' : 'Take Photo'}
              </span>
              <span className={`text-xs ${
                hasCameraPermission === false ? 'text-red-500' : 'text-slate-500'
              }`}>
                {hasCameraPermission === false ? 'Click to request access' : 'Use camera'}
              </span>
            </Button>
            
            {/* Debug Camera Button */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-600 mb-2">
                <strong>Debug Camera:</strong> Click to test camera functionality
              </div>
              <Button
                onClick={() => {
                  console.log('🔧 Debug camera button clicked');
                  console.log('📱 Navigator mediaDevices:', !!navigator.mediaDevices);
                  console.log('🎥 getUserMedia support:', !!navigator.mediaDevices?.getUserMedia);
                  console.log('📱 Permissions API:', !!navigator.permissions);
                  console.log('🔍 Current state:', {
                    hasCameraPermission,
                    isCameraOpen,
                    isProcessing,
                    videoRef: !!videoRef.current,
                    canvasRef: !!canvasRef.current
                  });
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                🔧 Debug Camera
              </Button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Hidden canvas for photo capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Camera View */}
        {isCameraOpen && (
          <div className="space-y-4">
            <div className="relative bg-slate-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 md:h-80 object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
                onLoadStart={() => console.log('🎬 Video load started')}
                onCanPlay={() => console.log('🎬 Video can play')}
                onLoadedData={() => console.log('🎬 Video data loaded')}
                onLoadedMetadata={() => console.log('🎬 Video metadata loaded')}
                onError={(e) => console.error('❌ Video error event:', e)}
              />
              
              {/* Loading overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Initializing camera...</p>
                  </div>
                </div>
              )}
              
              {/* Camera guide overlay */}
              {!isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed rounded-lg w-48 h-32 flex items-center justify-center bg-black/20">
                    <span className="text-white text-sm font-medium text-center">
                      Aim at ingredients
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={capturePhoto} 
                className="flex-1"
                disabled={isProcessing}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isProcessing ? 'Initializing...' : 'Capture Photo'}
              </Button>
              <Button onClick={closeCamera} variant="outline">
                Cancel
              </Button>
            </div>
            
            {/* Camera tips */}
            <div className="text-xs text-slate-500 text-center p-3 bg-slate-50 rounded-lg">
              💡 <strong>Tip:</strong> Hold your device steady and ensure good lighting for best results
            </div>
            
            {/* Mobile camera help */}
            <div className="text-xs text-slate-500 text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              📱 <strong>Mobile Users:</strong> If camera doesn't work, try refreshing the page or check browser settings for camera permissions
            </div>
          </div>
        )}

        {/* Selected Image Display */}
        {selectedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected ingredients"
                className="w-full h-64 object-cover rounded-lg border border-slate-200"
              />
              <Button
                onClick={clearImage}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={processImage}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Detect Ingredients
                  </>
                )}
              </Button>
              <Button onClick={clearImage} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
            
            {/* Debug Information */}
            <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
              <div><strong>Debug Info:</strong></div>
              <div>Camera Permission: {hasCameraPermission === null ? 'Checking...' : hasCameraPermission ? 'Granted' : 'Denied'}</div>
              <div>Camera Open: {isCameraOpen ? 'Yes' : 'No'}</div>
              <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
              <div>Video Ref: {videoRef.current ? 'Available' : 'Not Available'}</div>
              <div>Canvas Ref: {canvasRef.current ? 'Available' : 'Not Available'}</div>
            </div>
          </div>
        )}

        {/* Detected Ingredients */}
        {detectedIngredients.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-800">
                Detected Ingredients ({detectedIngredients.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {detectedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{ingredient.name}</div>
                      <div className="text-xs text-slate-500">
                        Confidence: {(ingredient.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeDetectedIngredient(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={addDetectedIngredients} className="flex-1">
                Add All Ingredients
              </Button>
              <Button onClick={clearImage} variant="outline">
                Start Over
              </Button>
            </div>
          </div>
        )}

        {/* AI Service Integration Note */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">AI</span>
            </div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Powered by AI Recognition</p>
              <p className="text-blue-600">
                This feature uses advanced computer vision to identify ingredients from photos. 
                For production use, integrate with services like Google Cloud Vision API, 
                Azure Computer Vision, or AWS Rekognition.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Global drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-center text-blue-700 bg-white/90 px-6 py-4 rounded-lg shadow-lg">
            <Upload className="w-12 h-12 mx-auto mb-2 text-blue-500" />
            <p className="text-lg font-semibold">Drop your image here</p>
            <p className="text-sm">Release to upload and analyze</p>
          </div>
        </div>
      )}
    </Card>
  );
}
