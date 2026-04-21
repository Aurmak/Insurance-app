import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Container, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  Paper,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { ArrowLeft, Camera, Upload, Trash2 } from 'lucide-react';

interface CapturedMedia {
  id: string;
  dataUrl: string;
  type: 'image' | 'video';
  timestamp: number;
}

export default function VehicleAddPhotoScreen() {
  const navigate = useNavigate();
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedMedia | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFromDevice = () => {
    uploadInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setFeedback('Choose a photo or video to continue.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      if (file.type.startsWith('image/')) {
        // Compress image
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          const newMedia: CapturedMedia = {
            id: Date.now().toString(),
            dataUrl: compressedDataUrl,
            type: 'image',
            timestamp: Date.now()
          };
          setCapturedPhoto(newMedia);
        };
        img.src = dataUrl;
      } else {
        // For video
        const newMedia: CapturedMedia = {
          id: Date.now().toString(),
          dataUrl: dataUrl,
          type: 'video',
          timestamp: Date.now()
        };
        setCapturedPhoto(newMedia);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleContinueToAI = async () => {
    if (!capturedPhoto) return;

    setIsProcessing(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Get the existing state
    const existingStateStr = sessionStorage.getItem('vehicleInitialState');
    if (!existingStateStr) {
      // Fallback - no existing state, just navigate back
      navigate('/ai-review/vehicle-initial', { replace: true });
      return;
    }

    const existingState = JSON.parse(existingStateStr);
    
    // Add the new photo to the existing photos array
    const updatedPhotos = [...existingState.photos, capturedPhoto];
    
    // Store the updated photos for AI processing
    sessionStorage.setItem('vehicleMediaForAI', JSON.stringify(updatedPhotos));
    
    // Keep the confirmed vehicle data
    sessionStorage.setItem('confirmedVehicleData', JSON.stringify(existingState.confirmedVehicle));
    
    // Clear the temporary state
    sessionStorage.removeItem('vehicleInitialState');

    setIsProcessing(false);
    
    // Navigate back to AI review which will reload with the new photos
    navigate('/ai-review/vehicle-initial', { replace: true });
  };

  const handleBack = () => {
    // Clear temporary state and go back
    sessionStorage.removeItem('vehicleInitialState');
    navigate('/ai-review/vehicle-initial');
  };

  const handleRemovePhoto = () => {
    setCapturedPhoto(null);
  };

  return (
    <div className="mobile-container">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {isProcessing && (
        <Backdrop
          open={isProcessing}
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'rgba(0, 0, 0, 0.7)'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Analysing photo...
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              AI is detecting observations
            </Typography>
          </Box>
        </Backdrop>
      )}

      <Box className="app-header" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h6" component="h1">
          Add photo
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 6 }}>
        {!capturedPhoto ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
            <Paper 
              elevation={0}
              onClick={handlePhotoCapture}
              sx={{ 
                width: '100%',
                aspectRatio: '4/3',
                bgcolor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                mb: 3,
                border: '2px dashed #ccc',
                '&:active': {
                  bgcolor: '#eeeeee',
                  borderColor: '#9C27B0'
                }
              }}
            >
              <Box sx={{ textAlign: 'center', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <Camera size={64} style={{ color: '#999' }} />
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Tap here to capture photo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add more angles for complete inspection
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleUploadFromDevice}
                startIcon={<Upload size={20} />}
                sx={{ py: 2 }}
              >
                Upload from device
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            {/* Large preview of captured photo */}
            <Box 
              sx={{ 
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 3,
                overflow: 'hidden',
                border: '2px solid #e0e0e0',
                mb: 3
              }}
            >
              {capturedPhoto.type === 'image' ? (
                <img 
                  src={capturedPhoto.dataUrl} 
                  alt="Vehicle" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              ) : (
                <video
                  src={capturedPhoto.dataUrl}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                  controls
                />
              )}
              <IconButton
                onClick={handleRemovePhoto}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  color: '#fff',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:active': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <Trash2 size={20} />
              </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              This photo will be analysed by AI and added to your vehicle inspection
            </Typography>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleContinueToAI}
                sx={{ py: 2, fontWeight: 600 }}
              >
                Continue to AI review
              </Button>
            </Box>
          </Box>
        )}
      </Container>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3000}
        onClose={() => setFeedback('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setFeedback('')} sx={{ width: '100%' }}>
          {feedback}
        </Alert>
      </Snackbar>
    </div>
  );
}
