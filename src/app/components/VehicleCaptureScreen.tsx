import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Container, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  CircularProgress,
  Backdrop,
  Paper,
  Card,
  CardContent,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { ArrowLeft, Camera, Upload, Trash2, Video, Mic, StopCircle, Play, Pause, Square } from 'lucide-react';

interface CapturedMedia {
  id: string;
  dataUrl: string;
  type: 'image' | 'video';
  timestamp: number;
  note?: string;
}

export default function VehicleCaptureScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const activeClaimId = sessionStorage.getItem('activeClaimId');
  const claimLine = sessionStorage.getItem('claimLine') || 'motor';
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [currentMedia, setCurrentMedia] = useState<CapturedMedia | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [feedback, setFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing captured media from sessionStorage when component mounts
  useEffect(() => {
    if (role === 'field-agent' && !activeClaimId) {
      setFeedback('No assigned claim found. Open an assigned claim before starting onsite assessment.');
      navigate('/reports-history');
      return;
    }

    const storedData = sessionStorage.getItem('vehicleCaptureData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.media && Array.isArray(data.media)) {
          setCapturedMedia(data.media);
        }
      } catch (error) {
        console.error('Error loading captured media:', error);
      }
    }
  }, [activeClaimId, navigate, role]);

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
          
          // Set as current media for note annotation
          const newMedia: CapturedMedia = {
            id: Date.now().toString(),
            dataUrl: compressedDataUrl,
            type: 'image',
            timestamp: Date.now()
          };
          setCurrentMedia(newMedia);
          setCurrentNote('');
        };
        img.src = dataUrl;
      } else {
        // For video, set as current media
        const newMedia: CapturedMedia = {
          id: Date.now().toString(),
          dataUrl: dataUrl,
          type: 'video',
          timestamp: Date.now()
        };
        setCurrentMedia(newMedia);
        setCurrentNote('');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    // Mock transcription results - immediately add to text note
    const mockTranscriptions = [
      "Front view of the vehicle showing minor scratches on the bonnet",
      "Rear bumper has a small dent on the left side",
      "Driver side door has paint chipping near the handle",
      "Windscreen has a small chip in the upper right corner",
      "Alloy wheels in good condition, no visible damage",
      "Passenger side mirror shows signs of wear",
    ];
    
    const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    setCurrentNote(transcription);
    setHasRecording(true);
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      // Start playing
      setIsPlaying(true);
      setPlaybackProgress(0);
      
      // Clear any existing interval
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      
      // Simulate 20 second playback with smooth progress updates
      const totalDuration = 20000; // 20 seconds
      const updateInterval = 50; // Update every 50ms for smooth animation
      const totalSteps = totalDuration / updateInterval;
      let currentStep = 0;
      
      playbackIntervalRef.current = setInterval(() => {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;
        setPlaybackProgress(progress);
        
        if (currentStep >= totalSteps) {
          // Playback finished
          setIsPlaying(false);
          setPlaybackProgress(0);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
          }
        }
      }, updateInterval);
    } else {
      // Pause playing
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }
  };

  const handleStopPlayback = () => {
    setIsPlaying(false);
  };

  const handleDeleteRecording = () => {
    setHasRecording(false);
    setCurrentNote('');
    setIsPlaying(false);
  };

  const handleAddAnotherMedia = () => {
    if (currentMedia) {
      // Add current media with note to the gallery
      setCapturedMedia(prev => [...prev, { ...currentMedia, note: currentNote }]);
      setCurrentMedia(null);
      setCurrentNote('');
      setHasRecording(false);
    }
  };

  const handleSkipNote = () => {
    if (currentMedia) {
      // Add current media without note
      setCapturedMedia(prev => [...prev, currentMedia]);
      setCurrentMedia(null);
      setCurrentNote('');
      setHasRecording(false);
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    setCapturedMedia(prev => prev.filter(media => media.id !== mediaId));
  };

  const handleDeleteCurrentMedia = () => {
    setCurrentMedia(null);
    setCurrentNote('');
    setHasRecording(false);
  };

  const handleContinue = async () => {
    // Include current media if it exists
    const allMedia = currentMedia 
      ? [...capturedMedia, { ...currentMedia, note: currentNote }]
      : capturedMedia;

    if (allMedia.length === 0) {
      setFeedback('Capture at least one photo or video first.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing - longer for multiple media
    const processingTime = 2000 + (allMedia.length * 500);
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    const mockByLine = {
      motor: [
        { make: 'Honda', model: 'Civic', color: 'Black', year: '2022', registration: 'LED-2345', confidence: { make: 94, model: 89, color: 96, registration: 92 } },
        { make: 'Toyota', model: 'Corolla', color: 'White', year: '2021', registration: 'ABC-1234', confidence: { make: 97, model: 92, color: 95, registration: 95 } },
      ],
      property: [
        { make: 'Property', model: 'Residential Unit', color: 'N/A', year: '2018', registration: '', confidence: { make: 93, model: 90, color: 100, registration: 0 } },
        { make: 'Property', model: 'Commercial Shop', color: 'N/A', year: '2016', registration: '', confidence: { make: 92, model: 88, color: 100, registration: 0 } },
      ],
      device: [
        { make: 'Apple', model: 'iPhone 14', color: 'Midnight', year: '2023', registration: '', confidence: { make: 96, model: 94, color: 92, registration: 0 } },
        { make: 'Samsung', model: 'Galaxy S23', color: 'Graphite', year: '2023', registration: '', confidence: { make: 95, model: 93, color: 91, registration: 0 } },
      ],
      industrial: [
        { make: 'Caterpillar', model: 'Hydraulic Unit', color: 'Yellow', year: '2019', registration: '', confidence: { make: 90, model: 89, color: 93, registration: 0 } },
        { make: 'Siemens', model: 'Power Panel', color: 'Grey', year: '2020', registration: '', confidence: { make: 91, model: 90, color: 94, registration: 0 } },
      ],
    } as const;

    const lineItems = mockByLine[claimLine as keyof typeof mockByLine] || mockByLine.motor;
    const randomVehicle = lineItems[Math.floor(Math.random() * lineItems.length)];

    // Store the AI-detected vehicle data with all media
    const vehicleData = {
      media: allMedia,
      photo: allMedia[0].dataUrl, // Primary photo for backwards compatibility
      aiDetected: randomVehicle,
      claimLine,
      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem('vehicleCaptureData', JSON.stringify(vehicleData));
    
    setIsProcessing(false);
    navigate('/vehicle-confirmation');
  };

  const handleBack = () => {
    navigate('/inspection-type');
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
              Analysing {capturedMedia.length + (currentMedia ? 1 : 0)} {capturedMedia.length + (currentMedia ? 1 : 0) === 1 ? 'item' : 'items'}...
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              AI is identifying loss context and asset details
            </Typography>
          </Box>
        </Backdrop>
      )}

      <Box className="app-header" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h6" component="h1">
          Capture claim evidence
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 6 }}>
        {!currentMedia && capturedMedia.length === 0 ? (
          // Initial empty state
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
                  Tap here to capture media
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Include multiple angles for best AI results
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
        ) : currentMedia ? (
          // Current media annotation state
          <Box>
            {/* Captured media gallery (small thumbnails) */}
            {capturedMedia.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                  Captured media ({capturedMedia.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  {capturedMedia.map((media) => (
                    <Box 
                      key={media.id}
                      sx={{ 
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2px solid #e0e0e0'
                      }}
                    >
                      {media.type === 'image' ? (
                        <img 
                          src={media.dataUrl} 
                          alt="Evidence" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }} 
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            bgcolor: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Video size={32} style={{ color: '#fff' }} />
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMedia(media.id)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          color: '#fff',
                          padding: '6px',
                          '&:active': {
                            bgcolor: 'rgba(0, 0, 0, 0.8)'
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Large preview of current media */}
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
              {currentMedia.type === 'image' ? (
                <img 
                  src={currentMedia.dataUrl} 
                  alt="Evidence" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              ) : (
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: '100%', 
                    bgcolor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Video size={64} style={{ color: '#fff' }} />
                </Box>
              )}
              <IconButton
                size="small"
                onClick={handleDeleteCurrentMedia}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: '#fff',
                  '&:active': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)'
                  }
                }}
              >
                <Trash2 size={20} />
              </IconButton>
              {currentMedia.type === 'video' && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  VIDEO
                </Box>
              )}
            </Box>

            {/* Voice note recording */}
            <Box sx={{ mb: 3 }}>
              {!hasRecording ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                  <Box
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:active': {
                        transform: 'scale(0.95)'
                      },
                      transition: 'transform 0.1s ease'
                    }}
                  >
                    {/* Animated ring when recording */}
                    {isRecording && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            bgcolor: 'rgba(244, 67, 54, 0.2)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%': {
                                transform: 'scale(1)',
                                opacity: 1
                              },
                              '100%': {
                                transform: 'scale(1.5)',
                                opacity: 0
                              }
                            }
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            bgcolor: 'rgba(244, 67, 54, 0.2)',
                            animation: 'pulse 1.5s ease-in-out infinite 0.5s',
                            '@keyframes pulse': {
                              '0%': {
                                transform: 'scale(1)',
                                opacity: 1
                              },
                              '100%': {
                                transform: 'scale(1.5)',
                                opacity: 0
                              }
                            }
                          }}
                        />
                      </>
                    )}
                    
                    {/* Main button */}
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: isRecording ? '#f44336' : '#9C27B0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: isRecording ? '0 4px 12px rgba(244, 67, 54, 0.4)' : '0 4px 12px rgba(27, 155, 215, 0.3)',
                        transition: 'all 0.3s ease',
                        zIndex: 1
                      }}
                    >
                      {isRecording ? <Square size={24} fill="white" /> : <Mic size={28} />}
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle1" sx={{ mt: 0.5, fontWeight: 600 }}>
                    Record voice note
                  </Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    bgcolor: '#fff',
                    borderRadius: 4,
                    border: 'none'
                  }}
                >
                  <IconButton
                    size="medium"
                    onClick={handlePlayPause}
                    sx={{
                      bgcolor: '#9C27B0',
                      color: '#fff',
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      '&:active': {
                        bgcolor: '#1587BA'
                      }
                    }}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </IconButton>
                  
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    {[...Array(40)].map((_, i) => {
                      const heights = [12, 24, 18, 32, 14, 28, 20, 36, 16, 30, 22, 26, 18, 32, 14, 24, 20, 28, 16, 34, 18, 26, 14, 30, 22, 32, 16, 28, 20, 24, 18, 30, 14, 26, 22, 34, 16, 28, 20, 24];
                      const progressBarIndex = Math.floor((playbackProgress / 100) * 40);
                      const isActive = i <= progressBarIndex;
                      return (
                        <Box
                          key={i}
                          sx={{
                            width: 2,
                            height: `${heights[i]}px`,
                            bgcolor: isActive ? '#9C27B0' : '#E1BEE7',
                            borderRadius: 1,
                            flexShrink: 0,
                            transition: 'background-color 0.1s ease'
                          }}
                        />
                      );
                    })}
                  </Box>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      minWidth: 40,
                      textAlign: 'right',
                      flexShrink: 0
                    }}
                  >
                    {isPlaying ? `0:${Math.floor(20 - (playbackProgress / 100) * 20).toString().padStart(2, '0')}` : '0:20'}
                  </Typography>

                  <IconButton
                    size="medium"
                    onClick={handleDeleteRecording}
                    sx={{
                      color: '#999',
                      flexShrink: 0,
                      '&:active': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        color: '#f44336'
                      }
                    }}
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Text note */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Or type your notes here..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff'
                  }
                }}
              />
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleAddAnotherMedia}
                sx={{ py: 2, fontWeight: 600 }}
              >
                Add another media
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleContinue}
                sx={{ py: 1.5 }}
              >
                Continue with AI analysis
              </Button>
            </Box>
          </Box>
        ) : (
          // Gallery view when there's captured media but no current media - show camera box to capture next
          <Box>
            {/* Captured media gallery (small thumbnails) */}
            {capturedMedia.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                  Captured media ({capturedMedia.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  {capturedMedia.map((media) => (
                    <Box 
                      key={media.id}
                      sx={{ 
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2px solid #e0e0e0'
                      }}
                    >
                      {media.type === 'image' ? (
                        <img 
                          src={media.dataUrl} 
                          alt="Vehicle" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }} 
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            bgcolor: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Video size={32} style={{ color: '#fff' }} />
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMedia(media.id)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          color: '#fff',
                          padding: '6px',
                          '&:active': {
                            bgcolor: 'rgba(0, 0, 0, 0.8)'
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Empty camera box for next capture */}
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
                  Tap here to capture next photo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add more angles for better results
                </Typography>
              </Box>
            </Paper>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Add more media or continue with AI analysis
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleContinue}
                sx={{ py: 2, fontWeight: 600 }}
              >
                Continue with AI analysis
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleUploadFromDevice}
                startIcon={<Upload size={20} />}
                sx={{ py: 1.5 }}
              >
                Upload from device
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
