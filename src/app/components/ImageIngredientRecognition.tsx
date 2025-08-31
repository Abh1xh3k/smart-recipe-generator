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
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      console.log('🔍 Checking camera permissions...');
      
      // Only run on client side
      if (typeof window === 'undefined') {
        console.log('❌ Not on client side');
        return false;
      }
      
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
      
      // Only run on client side
      if (typeof window === 'undefined') {
        throw new Error('Camera is not available on server side');
      }
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device');
      }

      console.log('🎥 Requesting camera access...');
      // Request camera permissions with mobile-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280, min: 320, max: 1920 },
          height: { ideal: 720, min: 240, max: 1080 },
          aspectRatio: { ideal: 16/9, min: 4/3, max: 21/9 }
        },
        audio: false
      });
      
      console.log('✅ Camera stream obtained:', stream);
      
      // Set camera open first to ensure video element is rendered
      setIsCameraOpen(true);
      
      // Wait for the next render cycle to ensure video element is in DOM
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
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
        
        // Add play event listener for mobile
        videoRef.current.oncanplay = () => {
          console.log('🎬 Video can play');
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('❌ Video play error:', err);
            });
          }
        };
      } else {
        console.error('❌ Video ref not available after render');
        setIsCameraOpen(false);
        throw new Error('Video element not found - please try again');
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      setIsProcessing(false);
      setIsCameraOpen(false);
      
      // Provide specific error messages for different scenarios
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera is not supported on this device or browser.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera constraints not supported. Trying with default settings...');
        // Try again with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
          });
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            streamRef.current = simpleStream;
            setIsCameraOpen(true);
            setIsProcessing(false);
          }
        } catch (simpleErr: any) {
          setError(`Camera access failed: ${simpleErr.message || 'Unknown error'}`);
        }
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

  // Set client flag and check camera permissions on mount
  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      setIsClient(true);
      console.log('🚀 Component mounted, checking camera permissions...');
      checkCameraPermission();
    }
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/20 backdrop-blur-sm overflow-y-auto">
      <Card 
        className={`w-full max-w-2xl mx-auto my-4 sm:my-8 transition-all duration-300 shadow-2xl border-0 ${
          isDragOver ? 'ring-2 ring-blue-400 ring-opacity-60 scale-[1.02]' : ''
        } bg-white/95 backdrop-blur-md relative overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Grainy texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               backgroundSize: '200px 200px'
             }}
        />
        
        <CardHeader className="relative z-10 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-blue-50/80 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-800">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-sm sm:text-base truncate">Image Recognition</span>
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1 text-xs sm:text-sm">
                Upload a photo or take a picture to automatically detect ingredients
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-slate-100/80 rounded-full p-1.5 sm:p-2 flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            </Button>
          </div>
        </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 relative z-10 bg-transparent overflow-y-auto flex-1 p-4 sm:p-6">
                  {/* Drag and Drop Instructions */}
          {!selectedImage && !isCameraOpen && (
            <div className="text-center p-4 sm:p-6 bg-gradient-to-r from-blue-50/60 to-purple-50/60 backdrop-blur-sm rounded-xl border border-blue-200/40 shadow-sm">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-blue-100/80 rounded-lg">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-blue-800 text-sm sm:text-base">Quick Upload</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-700/90">
                Drag and drop your ingredient images anywhere in this area, or use the buttons below
              </p>
            </div>
          )}
        
                                   {/* Image Input Methods */}
          {!selectedImage && !isCameraOpen && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`h-28 sm:h-36 flex flex-col items-center justify-center gap-2 sm:gap-3 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-xl backdrop-blur-sm ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50/60 scale-105 shadow-lg'
                    : 'border-slate-300/60 hover:border-blue-400/80 hover:bg-blue-50/40 hover:scale-[1.02]'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  isDragOver ? 'bg-blue-100/80' : 'bg-slate-100/60'
                }`}>
                  <Upload className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300 ${
                    isDragOver ? 'text-blue-600' : 'text-slate-500'
                  }`} />
                </div>
                <span className={`font-semibold transition-colors duration-300 text-sm sm:text-base ${
                  isDragOver ? 'text-blue-700' : 'text-slate-700'
                }`}>
                  {isDragOver ? 'Drop Image Here' : 'Upload Image'}
                </span>
                <span className={`text-xs transition-colors duration-300 ${
                  isDragOver ? 'text-blue-600' : 'text-slate-500'
                }`}>
                  {isDragOver ? 'Release to upload' : 'JPG, PNG up to 10MB'}
                </span>
                
                {/* Drag and drop hint */}
                <div className={`text-xs text-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${
                  isDragOver 
                    ? 'bg-blue-100/80 text-blue-700' 
                    : 'bg-slate-100/60 text-slate-600'
                }`}>
                  {isDragOver ? '🎯' : '📁'} Drag & drop or click to browse
                </div>
              </div>

                           <Button
                onClick={() => {
                  if (!isClient) return;
                  
                  console.log('📱 Camera button clicked');
                  console.log('🔍 Camera permission state:', hasCameraPermission);
                  console.log('📱 User agent:', navigator.userAgent);
                  console.log('📱 Platform:', navigator.platform);
                  console.log('📱 MediaDevices available:', !!navigator.mediaDevices);
                  
                  if (hasCameraPermission === false) {
                    console.log('🔐 Requesting camera permission...');
                    checkCameraPermission();
                  } else {
                    console.log('📸 Opening camera...');
                    openCamera();
                  }
                }}
                disabled={!isClient}
                variant="outline"
                className={`h-28 sm:h-36 flex flex-col items-center justify-center gap-2 sm:gap-3 border-2 border-dashed transition-all duration-300 rounded-xl backdrop-blur-sm ${
                  !isClient 
                    ? 'border-slate-200/60 bg-slate-50/40 cursor-not-allowed' 
                    : hasCameraPermission === false 
                    ? 'border-red-300/60 hover:border-red-400/80 hover:bg-red-50/40 hover:scale-[1.02]' 
                    : 'border-slate-300/60 hover:border-green-400/80 hover:bg-green-50/40 hover:scale-[1.02]'
                }`}
              >
                <div className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  hasCameraPermission === false ? 'bg-red-100/60' : 'bg-slate-100/60'
                }`}>
                  <Camera className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    hasCameraPermission === false ? 'text-red-500' : 'text-slate-500'
                  }`} />
                </div>
                <span className={`font-semibold text-sm sm:text-base ${
                  !isClient ? 'text-slate-500' : hasCameraPermission === false ? 'text-red-700' : 'text-slate-700'
                }`}>
                  {!isClient ? 'Loading...' : hasCameraPermission === false ? 'Grant Camera Permission' : 'Take Photo'}
                </span>
                <span className={`text-xs ${
                  !isClient ? 'text-slate-400' : hasCameraPermission === false ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {!isClient ? 'Initializing...' : hasCameraPermission === false ? 'Click to request access' : 'Use camera'}
                </span>
              </Button>
             
                           {/* Debug Camera Button */}
              <div className="col-span-full mt-4 p-3 sm:p-4 bg-slate-50/60 backdrop-blur-sm rounded-xl border border-slate-200/40">
                <div className="text-xs text-slate-600 mb-2 sm:mb-3">
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
                  className="w-full text-xs hover:bg-slate-100/80 h-8 sm:h-9"
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
            <div className="space-y-4 sm:space-y-6">
              <div className="relative bg-slate-100/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/40 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 sm:h-64 md:h-80 object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
                  onLoadStart={() => console.log('🎬 Video load started')}
                  onCanPlay={() => console.log('🎬 Video can play')}
                  onLoadedData={() => console.log('🎬 Video data loaded')}
                  onLoadedMetadata={() => console.log('🎬 Video metadata loaded')}
                  onError={(e) => console.error('❌ Video error event:', e)}
                  onPlay={() => console.log('🎬 Video started playing')}
                  onPause={() => console.log('🎬 Video paused')}
                  onStalled={() => console.log('🎬 Video stalled')}
                  onSuspend={() => console.log('🎬 Video suspended')}
                />
                
                {/* Loading overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white bg-black/40 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 animate-spin" />
                      <p className="text-xs sm:text-sm font-medium">Initializing camera...</p>
                    </div>
                  </div>
                )}
                
                {/* Camera guide overlay */}
                {!isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white/80 border-dashed rounded-xl w-32 h-24 sm:w-48 sm:h-32 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                      <span className="text-white text-xs sm:text-sm font-medium text-center px-2">
                        Aim at ingredients
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 sm:gap-4">
                <Button 
                  onClick={capturePhoto} 
                  className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium"
                  disabled={isProcessing}
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  {isProcessing ? 'Initializing...' : 'Capture Photo'}
                </Button>
                <Button onClick={closeCamera} variant="outline" className="h-10 sm:h-12 px-3 sm:px-6 text-sm sm:text-base">
                  Cancel
                </Button>
              </div>
              
              {/* Camera tips */}
              <div className="text-xs text-slate-600 text-center p-3 sm:p-4 bg-slate-50/60 backdrop-blur-sm rounded-xl border border-slate-200/40">
                💡 <strong>Tip:</strong> Hold your device steady and ensure good lighting for best results
              </div>
              
              {/* Mobile camera help */}
              <div className="text-xs text-slate-600 text-center p-3 sm:p-4 bg-blue-50/60 backdrop-blur-sm rounded-xl border border-blue-200/40">
                📱 <strong>Mobile Users:</strong> If camera doesn't work, try refreshing the page or check browser settings for camera permissions. 
                Make sure you're using HTTPS and have granted camera permissions.
              </div>
              
              {/* Mobile troubleshooting */}
              <div className="text-xs text-slate-600 text-center p-3 sm:p-4 bg-yellow-50/60 backdrop-blur-sm rounded-xl border border-yellow-200/40">
                🔧 <strong>Troubleshooting:</strong> 
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Ensure you're on HTTPS (required for camera access)</li>
                  <li>• Grant camera permissions when prompted</li>
                  <li>• Try refreshing the page if camera doesn't start</li>
                  <li>• Check if camera is being used by another app</li>
                  <li>• Try using a different browser if issues persist</li>
                </ul>
              </div>
            </div>
          )}

                                   {/* Selected Image Display */}
          {selectedImage && (
            <div className="space-y-4 sm:space-y-6">
              <div className="relative bg-slate-100/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/40 shadow-lg">
                <img
                  src={selectedImage}
                  alt="Selected ingredients"
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <Button
                  onClick={clearImage}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <Button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      Detect Ingredients
                    </>
                  )}
                </Button>
                <Button onClick={clearImage} variant="outline" className="h-10 sm:h-12 px-3 sm:px-6 text-sm sm:text-base">
                  Clear
                </Button>
              </div>
            </div>
          )}

                                   {/* Error Display */}
          {error && (
            <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-100/80 rounded-lg flex-shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <span className="text-red-700 text-xs sm:text-sm font-semibold">{error}</span>
              </div>
              
              {/* Debug Information */}
              <div className="text-xs text-red-600 bg-red-100/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-red-200/40">
                <div className="font-semibold mb-1 sm:mb-2">Debug Info:</div>
                <div className="space-y-0.5 sm:space-y-1 text-xs">
                  <div>Camera Permission: {hasCameraPermission === null ? 'Checking...' : hasCameraPermission ? 'Granted' : 'Denied'}</div>
                  <div>Camera Open: {isCameraOpen ? 'Yes' : 'No'}</div>
                  <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
                  <div>Video Ref: {videoRef.current ? 'Available' : 'Not Available'}</div>
                  <div>Canvas Ref: {canvasRef.current ? 'Available' : 'Not Available'}</div>
                </div>
              </div>
            </div>
          )}

                                   {/* Detected Ingredients */}
          {detectedIngredients.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100/80 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg">
                  Detected Ingredients ({detectedIngredients.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {detectedIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 sm:p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100/80 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-sm sm:text-base truncate">{ingredient.name}</div>
                        <div className="text-xs text-slate-500">
                          Confidence: {(ingredient.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeDetectedIngredient(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-100/80 rounded-full p-1.5 sm:p-2 flex-shrink-0 ml-2"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sm:gap-4 pt-2">
                <Button onClick={addDetectedIngredients} className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium">
                  Add All Ingredients
                </Button>
                <Button onClick={clearImage} variant="outline" className="h-10 sm:h-12 px-3 sm:px-6 text-sm sm:text-base">
                  Start Over
                </Button>
              </div>
            </div>
          )}

                 {/* AI Service Integration Note */}
         <div className="p-3 sm:p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-lg">
           <div className="flex items-start gap-2 sm:gap-3">
             <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
               <span className="text-blue-600 text-xs font-bold">AI</span>
             </div>
             <div className="text-xs sm:text-sm text-blue-700">
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
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none z-20">
          <div className="text-center text-blue-700 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-xl">
            <Upload className="w-12 h-12 mx-auto mb-2 text-blue-500" />
            <p className="text-lg font-semibold">Drop your image here</p>
            <p className="text-sm">Release to upload and analyze</p>
          </div>
        </div>
      )}
    </Card>
  </div>
  );
}
