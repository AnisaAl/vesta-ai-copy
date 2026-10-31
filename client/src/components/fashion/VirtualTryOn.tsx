import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';

interface VirtualTryOnProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productImageUrl: string;
  productName: string;
}

export default function VirtualTryOn({ open, onOpenChange, productImageUrl, productName }: VirtualTryOnProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setError(null);
      setUserPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!userPhotoFile || !productImageUrl) {
      setError('Please upload your photo first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      // Convert user photo to base64
      const userPhotoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(userPhotoFile);
      });

      // Convert product image to base64 if it's a URL (http/https or relative)
      let productImageBase64 = productImageUrl;
      
      // Check if it's a URL (absolute or relative) that needs to be fetched
      if (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://') || 
          productImageUrl.startsWith('/')) {
        try {
          // For relative URLs, use the current origin
          const imageUrl = productImageUrl.startsWith('/') 
            ? `${window.location.origin}${productImageUrl}`
            : productImageUrl;
            
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch product image: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          productImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1];
              resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Error fetching product image:', err);
          throw new Error(`Failed to load product image: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else if (productImageUrl.startsWith('data:')) {
        // Already a data URL, extract base64 part
        productImageBase64 = productImageUrl.split(',')[1];
      }

      // Call the virtual try-on API
      const response = await fetch('/api/virtual-try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPhoto: userPhotoBase64,
          productImage: productImageBase64,
          productName: productName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process virtual try-on' }));
        throw new Error(errorData.message || 'Failed to process virtual try-on');
      }

      const data = await response.json();
      
      if (data.resultImage) {
        setResultImage(`data:image/png;base64,${data.resultImage}`);
      } else {
        throw new Error('No result image received');
      }
    } catch (err) {
      console.error('Virtual try-on error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process virtual try-on. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUserPhoto(null);
    setUserPhotoFile(null);
    setResultImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Virtual Try-On</DialogTitle>
          <DialogDescription>
            Demo preview — not production Kolors quality yet. Upload a photo to see a
            approximate composite of how {productName} might look on you.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 mb-2">
          Demo mode: results may be a simple overlay until a real try-on model is wired.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {/* Product Image */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold mb-2">Product</h3>
            <div className="w-full aspect-square border rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={productImageUrl} 
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* User Photo Upload */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold mb-2">Your Photo</h3>
            {userPhoto ? (
              <div className="relative w-full aspect-square border rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={userPhoto} 
                  alt="Your photo"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 text-center px-4">
                    Click to upload your photo
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Result Preview */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold mb-2">Result</h3>
            <div className="w-full aspect-square border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              ) : resultImage ? (
                <img 
                  src={resultImage} 
                  alt="Virtual try-on result"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-gray-400 text-center px-4">
                  Result will appear here
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            <p className="font-semibold mb-2">Virtual Try-On Setup Required</p>
            <p className="whitespace-pre-line">{error}</p>
            <p className="mt-3 text-xs text-red-600">
              💡 Tip: See KOLORS_SETUP.md in the project root for detailed setup instructions.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button 
            onClick={handleTryOn} 
            disabled={!userPhoto || isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Try It On'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
