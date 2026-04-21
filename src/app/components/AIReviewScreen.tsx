import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Container,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Drawer,
  CircularProgress,
  Chip
} from '@mui/material';
import { ArrowLeft, Sparkles, Trash2, Zap, Mic, RefreshCw, Play, Square, X, Pause } from 'lucide-react';
import OfflineIndicator, { useOnlineStatus } from './OfflineIndicator';
import { autoSaveInspection } from '../utils/offlineStorage';

const MOTOR_OBSERVATIONS = [
  {
    title: 'Front Tire - Driver Side',
    description: 'Tire tread depth appears adequate (approximately 5mm remaining). No visible sidewall damage or bulges detected. Tire brand appears to be Michelin or similar premium brand.',
    category: 'Tires',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Front Bumper Minor Scratch',
    description: 'Small surface scratch detected on lower front bumper driver side, approximately 3 inches long. Paint is scratched but no dent visible. Does not affect structural integrity.',
    category: 'Body Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Windshield Condition - Good',
    description: 'Windshield appears clear with no cracks or chips visible. Wiper blades appear to be in good condition.',
    category: 'Glass',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Headlight Assembly - Passenger Side',
    description: 'Headlight lens is clear with no condensation detected. Housing appears secure with no visible cracks.',
    category: 'Lighting',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Door Panel Dent',
    description: 'Small dent detected on rear passenger door panel, approximately 2 inches in diameter. Paint not broken. Likely from parking lot impact.',
    category: 'Body Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Side Mirror - Driver Side',
    description: 'Mirror glass intact with no cracks. Housing appears secure. Indicator light visible (if equipped).',
    category: 'Mirrors',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Rear Bumper Scuff',
    description: 'Paint transfer and light scuffing visible on rear bumper near license plate. Appears to be from minor contact with another vehicle or object.',
    category: 'Body Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Wheel Rim Condition',
    description: 'Alloy wheel rim shows light curb rash on driver side front wheel. Cosmetic damage only, does not affect function.',
    category: 'Wheels',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Brake Disc Visible Condition',
    description: 'Brake disc visible through wheel shows normal wear pattern. No excessive rust or scoring visible.',
    category: 'Brakes',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Vehicle Paint Finish',
    description: 'Overall paint condition appears good. Clear coat is intact with normal shine visible. Some minor swirl marks from washing noted.',
    category: 'Paint Condition',
    urgent: false,
    isObservation: true,
  },
];

const PROPERTY_OBSERVATIONS = [
  {
    title: 'Ceiling Soot Deposition',
    description: 'Visible soot accumulation across upper ceiling surface indicates heat/smoke spread path from the primary fire area.',
    category: 'Fire Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Wall Plaster Delamination',
    description: 'Localized plaster separation noted on interior wall sections, likely due to thermal and moisture stress.',
    category: 'Structural Finish',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Water Ingress Marking',
    description: 'Moisture staining and damp marks indicate secondary water damage from firefighting or seepage.',
    category: 'Water Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Electrical Socket Discoloration',
    description: 'Heat discoloration observed around power outlets; electrical safety inspection is recommended before re-energizing.',
    category: 'Electrical Safety',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Door Frame Misalignment',
    description: 'Minor frame distortion visible, potentially from heat expansion and contraction during incident.',
    category: 'Joinery',
    urgent: false,
    isObservation: false,
  },
];

const DEVICE_OBSERVATIONS = [
  {
    title: 'Screen Impact Fracture',
    description: 'Crack propagation visible across display area, likely requiring full panel replacement.',
    category: 'Display',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Chassis Denting',
    description: 'Frame deformation near corner impact zone suggests drop-related structural stress.',
    category: 'Body Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Lens/Camera Cover Scratching',
    description: 'Surface scratches detected around camera module; image clarity impact may require module testing.',
    category: 'Optics',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Liquid Exposure Indicator Risk',
    description: 'Corrosion-like residue visible around port area, indicating possible liquid ingress.',
    category: 'Liquid Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Button Tactile Wear',
    description: 'Power/volume key response appears inconsistent; functional check recommended.',
    category: 'Functional Condition',
    urgent: false,
    isObservation: true,
  },
];

const INDUSTRIAL_OBSERVATIONS = [
  {
    title: 'Hydraulic Line Leakage Trace',
    description: 'Fluid staining pattern suggests active or recent hydraulic leakage near coupling points.',
    category: 'Hydraulic System',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Guard Assembly Deformation',
    description: 'Protective guard appears bent with possible impact transfer to adjacent machine surfaces.',
    category: 'Mechanical Damage',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Control Panel Heat Marking',
    description: 'Localized thermal discoloration on panel face may indicate internal heat stress event.',
    category: 'Electrical Control',
    urgent: false,
    isObservation: false,
  },
  {
    title: 'Belt Alignment Variance',
    description: 'Drive belt path appears off-center relative to pulleys; alignment inspection is advised.',
    category: 'Operational Integrity',
    urgent: false,
    isObservation: true,
  },
  {
    title: 'Safety Signage Obstruction',
    description: 'Critical warning labels are partially obscured by residue and need replacement/cleaning.',
    category: 'Safety Compliance',
    urgent: false,
    isObservation: true,
  },
];

interface DetectedIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  urgent: boolean;
  detectedRoom: string;
  isObservation: boolean;
  photoIndex: number; // Track which photo this observation belongs to
}

function getObservationPool(claimLine: string) {
  if (claimLine === 'property') return PROPERTY_OBSERVATIONS;
  if (claimLine === 'device') return DEVICE_OBSERVATIONS;
  if (claimLine === 'industrial') return INDUSTRIAL_OBSERVATIONS;
  return MOTOR_OBSERVATIONS;
}

export default function AIReviewScreen() {
  const navigate = useNavigate();
  const { observationId } = useParams();
  const claimLine = sessionStorage.getItem('claimLine') || 'motor';
  const isOnline = useOnlineStatus();
  const [observationData, setObservationData] = useState<any>(null);
  const [detectedObservations, setDetectedObservations] = useState<DetectedIssue[]>([]);
  const [additionalTypedNote, setAdditionalTypedNote] = useState('');
  const [additionalVoiceNote, setAdditionalVoiceNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isReRunning, setIsReRunning] = useState(false);
  const [showContextDrawer, setShowContextDrawer] = useState(false);
  const [currentReRunPhotoIndex, setCurrentReRunPhotoIndex] = useState<number | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [showBackWarning, setShowBackWarning] = useState(false);

  useEffect(() => {
    // Handle vehicle initial inspection (special case)
    if (observationId === 'vehicle-initial') {
      const vehicleMediaStr = sessionStorage.getItem('vehicleMediaForAI');
      const confirmedVehicleStr = sessionStorage.getItem('confirmedVehicleData');
      
      if (!vehicleMediaStr || !confirmedVehicleStr) {
        navigate('/dashboard', { replace: true });
        return;
      }
      
      const vehicleMedia = JSON.parse(vehicleMediaStr);
      const confirmedVehicle = JSON.parse(confirmedVehicleStr);
      const observationPool = getObservationPool(claimLine);
      const roomLabelByLine: Record<string, string> = {
        motor: `Vehicle: ${confirmedVehicle.reg || 'N/A'}`,
        property: 'Property Assessment',
        device: 'Device Assessment',
        industrial: 'Industrial Asset Assessment',
      };
      
      // Create fake observation data using vehicle photos
      const fakeObservationData = {
        id: 'vehicle-initial',
        photo: vehicleMedia[0].dataUrl, // Use first photo
        photos: vehicleMedia, // Store all photos
        voiceNote: null,
        typedNote: `Initial ${claimLine} inspection: ${confirmedVehicle.name}`,
        timestamp: Date.now(),
        roomId: claimLine,
        roomName: roomLabelByLine[claimLine] || 'Asset Assessment'
      };
      
      setObservationData(fakeObservationData);
      
      // Simulate AI analyzing each evidence photo (1-2 observations per photo)
      const allSelectedItems: DetectedIssue[] = [];
      
      vehicleMedia.forEach((media: any, photoIndex: number) => {
        // Generate 1-2 observations per photo
        const numberOfObservationsForThisPhoto = Math.floor(Math.random() * 2) + 1; // 1-2 items per photo
        const shuffled = [...observationPool].sort(() => 0.5 - Math.random());
        const selectedItems = shuffled.slice(0, numberOfObservationsForThisPhoto).map((observation, obsIndex) => ({
          id: `vehicle-initial-photo${photoIndex}-obs${obsIndex}-${Date.now()}`,
          ...observation,
          detectedRoom: roomLabelByLine[claimLine] || 'Asset Assessment',
          photoIndex: photoIndex, // Link to specific photo
        }));
        
        allSelectedItems.push(...selectedItems);
      });
      
      setDetectedObservations(allSelectedItems);
      
      // Clean up vehicle media from session storage
      sessionStorage.removeItem('vehicleMediaForAI');
      return;
    }
    
    // Load observation data
    const data = JSON.parse(sessionStorage.getItem(`observation-${observationId}`) || 'null');
    
    // If no observation data (e.g., when resuming from a draft), redirect to inspection report
    if (!data) {
      navigate('/inspection-report', { replace: true });
      return;
    }
    
    setObservationData(data);
    const observationPool = getObservationPool(claimLine);

    // Extract detected room from voice note
    let detectedRoom = 'Unknown Room';
    if (data?.voiceNote) {
      const match = data.voiceNote.match(/Detected: ([^)]+)/);
      if (match) {
        detectedRoom = match[1];
      }
    }

    // Simulate AI detecting issues and/or observations
    // 30% chance of only observations (no issues)
    // 70% chance of issues (1-3 issues)
    const hasOnlyObservations = Math.random() < 0.3;
    
    let selectedItems: DetectedIssue[] = [];
    
    if (hasOnlyObservations) {
      // Only observations - pick 1-2 observations
      const numberOfObservations = Math.floor(Math.random() * 2) + 1;
      const shuffledObs = [...observationPool].sort(() => 0.5 - Math.random());
      selectedItems = shuffledObs.slice(0, numberOfObservations).map((observation, index) => ({
        id: `${observationId}-obs-${index}`,
        ...observation,
        urgent: false,
        detectedRoom,
        photoIndex: index // Assign photo index
      }));
    } else {
      // Has issues - pick 1-3 issues and maybe 0-1 observations
      const numberOfIssues = Math.floor(Math.random() * 3) + 1;
      const shuffledIssues = [...observationPool].sort(() => 0.5 - Math.random());
      const issues = shuffledIssues.slice(0, numberOfIssues).map((suggestion, index) => ({
        id: `${observationId}-issue-${index}`,
        ...suggestion,
        urgent: false,
        detectedRoom,
        photoIndex: index // Assign photo index
      }));
      
      selectedItems = [...issues];
      
      // 40% chance to also include an observation with the issues
      if (Math.random() < 0.4) {
        const shuffledObs = [...observationPool].sort(() => 0.5 - Math.random());
        const observation = {
          id: `${observationId}-obs-0`,
          ...shuffledObs[0],
          urgent: false,
          detectedRoom,
          photoIndex: 0 // Assign photo index
        };
        selectedItems.push(observation);
      }
    }
    
    setDetectedObservations(selectedItems);
  }, [observationId, navigate, claimLine]);

  const handleUpdateObservation = (id: string, field: string, value: string | boolean) => {
    setDetectedObservations(
      detectedObservations.map((observation) =>
        observation.id === id ? { ...observation, [field]: value } : observation
      )
    );
  };

  const handleRemoveObservation = (id: string) => {
    setDetectedObservations(detectedObservations.filter((observation) => observation.id !== id));
  };

  const handleConfirmObservations = () => {
    // Save the observations to sessionStorage
    const data = JSON.parse(sessionStorage.getItem('inspectionData') || '{\"rooms\":[],\"observations\":[]}');
    
    // Ensure observations array exists (for backwards compatibility)
    if (!data.observations) {
      data.observations = [];
    }
    
    // Ensure rooms array exists
    if (!data.rooms) {
      data.rooms = [];
    }
    
    // Add all confirmed observations
    detectedObservations.forEach(observation => {
      data.observations.push({
        ...observation,
        roomId: observationData.roomId,
        roomName: observationData.roomName,
        photo: observationData.photo,
        timestamp: observationData.timestamp,
        voiceNote: observationData.voiceNote,
        typedNote: observationData.typedNote,
      });
    });
    
    // Mark room as completed
    if (observationData.roomId && !data.rooms.includes(observationData.roomId)) {
      data.rooms.push(observationData.roomId);
    }
    
    sessionStorage.setItem('inspectionData', JSON.stringify(data));
    
    // Store the last AI review observationId for back navigation
    sessionStorage.setItem('lastAIReviewObservationId', observationId);
    
    // Keep observation in temporary storage for back navigation
    // It will be cleaned up when the inspection is submitted or saved
    
    // Auto-save progress - save to inspection-report step since AI review is complete
    const vehicleName = sessionStorage.getItem('selectedVehicleName') || 'Vehicle';
    const inspectionType = sessionStorage.getItem('inspectionType') || 'inspection';
    autoSaveInspection(vehicleName, inspectionType, '/inspection-report');
    
    navigate('/inspection-report');
  };

  const handleDeleteAll = () => {
    // Delete the observation
    sessionStorage.removeItem(`observation-${observationId}`);
    navigate('/add-observation');
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // Simulate voice note capture
      const mockVoiceNote = 'recorded';
      setAdditionalVoiceNote(mockVoiceNote);
      
      // Generate dummy transcription text (user adding location/area context)
      const transcriptions = [
        'This is near the window on the left side',
        'Located by the door frame, about three feet up',
        'This is on the ceiling in the corner',
        'Right above the radiator on the east wall',
        'Near the baseboard, close to the electrical outlet',
        'On the wall behind the furniture',
        'This is in the upper right corner of the room'
      ];
      const randomTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
      setAdditionalTypedNote(randomTranscription);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const handlePlayVoice = () => {
    if (isPlayingVoice) {
      // Stop playing
      setIsPlayingVoice(false);
    } else {
      // Start playing
      setIsPlayingVoice(true);
      // Simulate playback (3 seconds)
      setTimeout(() => {
        setIsPlayingVoice(false);
      }, 3000);
    }
  };

  const handleDeleteVoiceNote = () => {
    setAdditionalVoiceNote('');
    setIsPlayingVoice(false);
    setAdditionalTypedNote('');
  };

  const handleReRunAI = () => {
    setIsReRunning(true);
    
    // Simulate AI re-analysis with new context (2 second delay)
    setTimeout(() => {
      const observationPool = getObservationPool(claimLine);
      const confirmedVehicleStr = sessionStorage.getItem('confirmedVehicleData');
      const confirmedVehicle = confirmedVehicleStr ? JSON.parse(confirmedVehicleStr) : null;
      const roomLabelByLine: Record<string, string> = {
        motor: `Vehicle: ${confirmedVehicle?.reg || 'N/A'}`,
        property: 'Property Assessment',
        device: 'Device Assessment',
        industrial: 'Industrial Asset Assessment',
      };
      
      // Extract detected room from additional notes if available
      let detectedRoom = detectedObservations[0]?.detectedRoom || roomLabelByLine[claimLine] || 'Asset Assessment';
      
      if (additionalVoiceNote) {
        const match = additionalVoiceNote.match(/Detected: ([^)]+)/);
        if (match) {
          detectedRoom = match[1];
        }
      }

      // Simulate AI finding different or additional findings based on new context
      // Only regenerate observations for the specific photo
      const photoIndexToReRun = currentReRunPhotoIndex;
      
      if (photoIndexToReRun === null) return;
      
      // Remove existing observations for this photo
      const otherObservations = detectedObservations.filter(obs => obs.photoIndex !== photoIndexToReRun);
      
      // Generate new observations for this specific photo
      const hasOnlyObservations = Math.random() < 0.3;
      let newItems: DetectedIssue[] = [];
      
      if (hasOnlyObservations) {
        const numberOfObservations = Math.floor(Math.random() * 2) + 1;
        const shuffledObs = [...observationPool].sort(() => 0.5 - Math.random());
        newItems = shuffledObs.slice(0, numberOfObservations).map((observation, index) => ({
          id: `${observationId}-rerun-${Date.now()}-photo${photoIndexToReRun}-obs-${index}`,
          ...observation,
          urgent: false,
          detectedRoom,
          description: additionalTypedNote 
            ? `${observation.description} Additional context: ${additionalTypedNote}` 
            : observation.description,
          photoIndex: photoIndexToReRun
        }));
      } else {
        const numberOfIssues = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...observationPool].sort(() => 0.5 - Math.random());
        const issues = shuffled.slice(0, numberOfIssues).map((suggestion, index) => ({
          id: `${observationId}-rerun-${Date.now()}-photo${photoIndexToReRun}-issue-${index}`,
          ...suggestion,
          urgent: false,
          detectedRoom,
          description: additionalTypedNote 
            ? `${suggestion.description} Additional context: ${additionalTypedNote}` 
            : suggestion.description,
          photoIndex: photoIndexToReRun
        }));
        
        newItems = [...issues];
        
        if (Math.random() < 0.4) {
          const shuffledObs = [...observationPool].sort(() => 0.5 - Math.random());
          const observation = {
            id: `${observationId}-rerun-${Date.now()}-photo${photoIndexToReRun}-obs-0`,
            ...shuffledObs[0],
            urgent: false,
            detectedRoom,
            photoIndex: photoIndexToReRun
          };
          newItems.push(observation);
        }
      }
      
      // Combine other observations with new observations for this photo
      setDetectedObservations([...otherObservations, ...newItems]);
      setIsReRunning(false);
      setShowContextDrawer(false);
      setCurrentReRunPhotoIndex(null);
      setAdditionalTypedNote('');
      setAdditionalVoiceNote('');
    }, 2000);
  };

  if (!observationData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <OfflineIndicator />
      
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => setShowBackWarning(true)} sx={{ mr: 1 }}>
            <ArrowLeft size={24} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>AI Review</Typography>
        </Box>
        <OfflineIndicator />
      </Box>

      <Container sx={{ py: 3, pb: 5 }}>
        <Alert severity="info" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Zap size={24} style={{ marginRight: 16, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {isOnline ? 'AI Analysis' : 'Offline AI Analysis'}
              </Typography>
              <Typography variant="body2">
                {(() => {
                  const issues = detectedObservations.filter(item => !item.isObservation);
                  const observations = detectedObservations.filter(item => item.isObservation);
                  if (issues.length > 0 && observations.length > 0) {
                    return `AI detected ${issues.length} issue${issues.length > 1 ? 's' : ''} and ${observations.length} observation${observations.length > 1 ? 's' : ''}`;
                  } else if (issues.length > 0) {
                    return `AI detected ${issues.length} issue${issues.length > 1 ? 's' : ''}`;
                  } else {
                    return `AI found ${observations.length} observation${observations.length > 1 ? 's' : ''} (no issues detected)`;
                  }
                })()}
              </Typography>
            </Box>
          </Box>
        </Alert>

        {isReRunning && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Sparkles size={18} style={{ marginRight: 8 }} />
              AI is re-analysing the photo with your additional context...
            </Box>
          </Alert>
        )}

        {detectedObservations.length === 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Sparkles size={48} style={{ color: '#9C27B0' }} />
              </Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                No Observations Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All AI-detected observations have been removed. You can re-run the AI analysis with additional context to detect new observations.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Group observations by photo and display each photo with its observations */}
        {observationData.photos && observationData.photos.length > 0 && (
          observationData.photos.map((media: any, photoIndex: number) => {
            const observationsForThisPhoto = detectedObservations.filter(obs => obs.photoIndex === photoIndex);
            
            if (observationsForThisPhoto.length === 0) return null;
            
            return (
              <Box key={photoIndex} sx={{ mb: 4 }}>
                {/* Photo header */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {media.type === 'video' ? `Video ${photoIndex + 1}` : `Photo ${photoIndex + 1}`}
                  </Typography>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: '#f5f5f5',
                      mb: 2
                    }}
                  >
                    {media.type === 'video' ? (
                      <video
                        src={media.dataUrl}
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          display: 'block',
                          borderRadius: 8
                        }}
                        controls
                      />
                    ) : (
                      <img
                        src={media.dataUrl}
                        alt={`Photo ${photoIndex + 1}`}
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          display: 'block',
                          borderRadius: 8
                        }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    {observationsForThisPhoto.length} observation{observationsForThisPhoto.length > 1 ? 's' : ''} detected
                  </Typography>
                </Box>

                {/* Re-run AI analysis button for this photo */}
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2, py: 1.5 }}
                  onClick={() => {
                    setCurrentReRunPhotoIndex(photoIndex);
                    setShowContextDrawer(true);
                  }}
                >
                  <RefreshCw size={18} style={{ marginRight: 8 }} />
                  Re-run AI analysis
                </Button>

                {/* Observations for this photo */}
                {observationsForThisPhoto.map((issue, obsIndex) => {
                  const globalIndex = detectedObservations.indexOf(issue);
                  return (
                    <Card 
                      key={issue.id} 
                      sx={{ 
                        mb: 2,
                        borderLeft: issue.isObservation ? '4px solid #4CAF50' : '4px solid #ff9800',
                        bgcolor: issue.isObservation ? '#f1f8f4' : 'white'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {issue.isObservation ? 'Observation' : 'Issue'} {obsIndex + 1}
                            </Typography>
                            <Chip 
                              label={issue.isObservation ? 'No Action Required' : 'Requires Attention'} 
                              size="small"
                              color={issue.isObservation ? 'success' : 'warning'}
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          </Box>
                          <IconButton color="error" size="small" onClick={() => handleRemoveObservation(issue.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>

                        {issue.isObservation && (
                          <Alert severity="success" sx={{ mb: 2, py: 0.5 }}>
                            <Typography variant="caption">
                              This is an informational finding. It will still be included in the report submitted to Platform.
                            </Typography>
                          </Alert>
                        )}

                        <Box component="form">
                          <TextField
                            fullWidth
                            label={issue.isObservation ? "Observation Title" : "Issue Title"}
                            value={issue.title}
                            onChange={(e) => handleUpdateObservation(issue.id, 'title', e.target.value)}
                            sx={{ mb: 3 }}
                          />

                          <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={4}
                            value={issue.description}
                            onChange={(e) => handleUpdateObservation(issue.id, 'description', e.target.value)}
                            sx={{ mb: 3 }}
                          />

                          <TextField
                            fullWidth
                            label="Category"
                            value={issue.category}
                            onChange={(e) => handleUpdateObservation(issue.id, 'category', e.target.value)}
                            sx={{ mb: 3 }}
                          />

                          {!issue.isObservation && observationId !== 'vehicle-initial' && (
                            <Box sx={{ mb: 3 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={issue.urgent}
                                    onChange={(e) => handleUpdateObservation(issue.id, 'urgent', e.target.checked)}
                                  />
                                }
                                label="Mark as Urgent"
                              />
                              {issue.urgent && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                  This issue will be flagged for immediate attention
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            );
          })
        )}

        <Button 
          variant="outlined" 
          fullWidth
          sx={{ py: 1.5, mb: 2 }}
          onClick={() => {
            if (observationId === 'vehicle-initial') {
              // Store current state before adding another photo
              const currentState = {
                observations: detectedObservations,
                confirmedVehicle: JSON.parse(sessionStorage.getItem('confirmedVehicleData') || '{}')
              };
              sessionStorage.setItem('vehicleInitialState', JSON.stringify(currentState));
              navigate('/vehicle-add-photo');
            }
          }}
        >
          Add another photo
        </Button>

        {detectedObservations.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {observationId !== 'vehicle-initial' && (
              <Button 
                variant="outlined" 
                color="error" 
                fullWidth
                sx={{ py: 1.5 }}
                onClick={handleDeleteAll}
              >
                Delete all
              </Button>
            )}
            <Button 
              variant="contained" 
              fullWidth
              sx={{ py: 1.5 }}
              onClick={handleConfirmObservations}
            >
              Accept & continue
            </Button>
          </Box>
        )}
      </Container>

      {/* Add More Context Bottom Sheet */}
      <Drawer 
        anchor="bottom"
        open={showContextDrawer} 
        onClose={() => setShowContextDrawer(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85vh'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Re-run AI Analysis</Typography>
            <IconButton onClick={() => setShowContextDrawer(false)}>
              <X size={24} />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Provide additional details to help AI better identify and describe issues
          </Typography>
          
          {/* Voice note recording - circular button pattern */}
          <Box sx={{ mb: 3 }}>
            {!additionalVoiceNote ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                <Box
                  onClick={isRecording ? handleVoiceRecord : handleVoiceRecord}
                  sx={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
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
                      boxShadow: isRecording ? '0 4px 12px rgba(244, 67, 54, 0.4)' : '0 4px 12px rgba(156, 39, 176, 0.3)',
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
                  onClick={handlePlayVoice}
                  sx={{
                    bgcolor: '#9C27B0',
                    color: '#fff',
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    '&:hover': {
                      bgcolor: '#8E24AA'
                    }
                  }}
                >
                  {isPlayingVoice ? <Pause size={20} /> : <Play size={20} />}
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
                  {isPlayingVoice ? `0:${Math.floor(3 - (playbackProgress / 100) * 3).toString().padStart(2, '0')}` : '0:03'}
                </Typography>

                <IconButton
                  size="medium"
                  onClick={handleDeleteVoiceNote}
                  sx={{
                    color: '#999',
                    flexShrink: 0,
                    '&:hover': {
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

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Or type your notes here..."
            value={additionalTypedNote}
            onChange={(e) => setAdditionalTypedNote(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleReRunAI}
            disabled={isReRunning || (!additionalTypedNote && !additionalVoiceNote)}
            sx={{ py: 1.5 }}
          >
            {isReRunning ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} color="inherit" />
                Re-analysing with AI...
              </>
            ) : (
              <>
                <RefreshCw size={18} style={{ marginRight: 8 }} />
                Re-run AI analysis
              </>
            )}
          </Button>

          {(!additionalTypedNote && !additionalVoiceNote) && (
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 2 }}>
              Add typed or voice notes to enable AI re-analysis
            </Typography>
          )}
        </Box>
      </Drawer>

      {/* Back Warning Bottom Sheet */}
      <Drawer 
        anchor="bottom"
        open={showBackWarning} 
        onClose={() => setShowBackWarning(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Discard AI Review?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Going back will discard all AI-detected observations and analysis. You'll need to capture a new photo and run AI analysis again.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={() => {
                if (observationId === 'vehicle-initial') {
                  // For vehicle-initial inspection, go back to vehicle-confirmation
                  // Don't clear the vehicle data so the confirmation page can load properly
                  sessionStorage.removeItem('vehicleMediaForAI');
                  sessionStorage.removeItem('vehicleInitialState');
                  navigate('/vehicle-confirmation');
                }
              }}
              sx={{ py: 1.5, fontWeight: 500 }}
            >
              Discard & go back
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setShowBackWarning(false)}
              sx={{ py: 1.5, fontWeight: 500 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
