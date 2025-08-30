'use client';

import { useState, useRef, useCallback } from 'react';
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

interface DetectedIngredient {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function ImageIngredientRecognition({ onIngredientsDetected, onClose }: ImageIngredientRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Open camera
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
        setError(null);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageData);
        closeCamera();
        setDetectedIngredients([]);
      }
    }
  }, [closeCamera]);

  // Process image with AI recognition
  const processImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Try to use Gemini first, fallback to simulation if not available
      if (imageRecognitionService.isGeminiAvailable()) {
        const response = await imageRecognitionService.recognizeIngredients({
          imageData: selectedImage,
          maxResults: 10
        });
        setDetectedIngredients(response.ingredients);
      } else {
        // Fallback to simulation if Gemini is not initialized
        const response = await imageRecognitionService.simulateRecognition({
          imageData: selectedImage,
          maxResults: 10
        });
        setDetectedIngredients(response.ingredients);
      }
    } catch (err) {
      console.error('Image recognition failed:', err);
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
    <Card className="w-full max-w-2xl mx-auto">
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
        {/* Image Input Methods */}
        {!selectedImage && !isCameraOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-slate-600">Upload Image</span>
              <span className="text-xs text-slate-500">JPG, PNG up to 10MB</span>
            </Button>

            <Button
              onClick={openCamera}
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50"
            >
              <Camera className="w-8 h-8 text-slate-400" />
              <span className="text-slate-600">Take Photo</span>
              <span className="text-xs text-slate-500">Use camera</span>
            </Button>
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

        {/* Camera View */}
        {isCameraOpen && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover rounded-lg border border-slate-200"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white border-dashed rounded-lg w-48 h-32 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Aim at ingredients</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
              <Button onClick={closeCamera} variant="outline">
                Cancel
              </Button>
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
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
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
    </Card>
  );
}
