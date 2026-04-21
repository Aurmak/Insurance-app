import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Container, 
  Card,
  CardContent,
  Button, 
  TextField,
  Typography, 
  Box, 
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { ArrowLeft, CheckCircle2, AlertCircle, Camera, Edit2 } from 'lucide-react';
import {
  attachVehicleVerificationSnapshot,
  createDraftClaim,
  getClaimById,
  setAssigned,
  setErpCreated,
} from '../domain/claims/service';
import { createErpClaim, assignErpClaim } from '../domain/integrations/erpAdapter';
import { verifyVehicleFromRegistry } from '../domain/integrations/vehicleVerification';

interface VehicleData {
  media?: Array<{
    id: string;
    dataUrl: string;
    type: 'image' | 'video';
    timestamp: number;
  }>;
  photo: string;
  aiDetected: {
    make: string;
    model: string;
    color: string;
    year: string;
    registration: string;
    confidence: {
      make: number;
      model: number;
      color: number;
      registration: number;
    };
  };
  timestamp: string;
}

// Pakistani Vehicle Verification Data (from Excise & Taxation API)
interface PakistanVehicleData {
  registrationNo: string;
  make: string;
  vehicleModel: string;
  registrationDate: string;
  taxPayment: string;
  engineNo: string;
  bodyType: string;
  ownerName: string;
  modelYear: string;
  seatingCapacity: string;
  cplc: string; // "Vehicle is Clear" or other status
  safeCustody: string; // "Vehicle is Clear" or other status
  horsePower: string;
  classOfVehicle: string;
  verified: boolean;
}

export default function VehicleConfirmationScreen() {
  const navigate = useNavigate();
  const claimLine = sessionStorage.getItem('claimLine') || 'motor';
  const isMotorClaim = claimLine === 'motor';
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [checksComplete, setChecksComplete] = useState(false);
  const [checksResults, setChecksResults] = useState({
    stolen: false,
    finance: false,
    vin: true
  });
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [pakistanVehicleData, setPakistanVehicleData] = useState<PakistanVehicleData | null>(null);
  const [isVerifyingWithAPI, setIsVerifyingWithAPI] = useState(false);
  const [apiVerificationComplete, setApiVerificationComplete] = useState(false);
  const [feedback, setFeedback] = useState('');

  const ensureActiveClaim = () => {
    const existing = activeClaimId || sessionStorage.getItem('activeClaimId');
    if (existing) {
      setActiveClaimId(existing);
      return existing;
    }

    const created = createDraftClaim({
      policyNumber: sessionStorage.getItem('policyNumber') || 'POL-DEMO-0001',
      insurerId: sessionStorage.getItem('insurerId') || 'insurer-demo',
      createdByUserId: sessionStorage.getItem('userId') || 'policyholder-demo',
      lossType: sessionStorage.getItem('inspectionType') || 'collision',
      locationAddress: 'Karachi, Pakistan',
    });
    setActiveClaimId(created.id);
    sessionStorage.setItem('activeClaimId', created.id);
    return created.id;
  };

  useEffect(() => {
    // Load vehicle data from session storage
    const storedData = sessionStorage.getItem('vehicleCaptureData');
    if (storedData) {
      const data: VehicleData = JSON.parse(storedData);
      setVehicleData(data);
      // Pre-fill AI detected values
      setMake(data.aiDetected.make);
      setModel(data.aiDetected.model);
      setYear(data.aiDetected.year);
      setColor(data.aiDetected.color);
      setRegistration(data.aiDetected.registration || '');
      const existingClaimId = sessionStorage.getItem('activeClaimId');
      if (existingClaimId) {
        setActiveClaimId(existingClaimId);
      }
      
      // Do NOT automatically run vehicle checks - user must trigger it manually
    } else {
      // No data, go back
      navigate('/inspection-type');
    }
  }, [navigate]);

  const handleBack = () => {
    // Don't remove vehicleCaptureData - allow user to go back and add more photos
    navigate('/vehicle-capture');
  };

  const runVehicleChecks = async () => {
    if (!isMotorClaim) {
      return;
    }
    if (!registration.trim()) {
      setFeedback('Enter the registration number first.');
      return;
    }

    const claimId = ensureActiveClaim();
    setIsVerifyingWithAPI(true);
    setIsRunningChecks(true);

    const snapshot = await verifyVehicleFromRegistry({
      claimId,
      registrationNumber: registration,
      make,
      model,
      year,
    });

    const verifiedVehicleData: PakistanVehicleData = {
      registrationNo: snapshot.registrationNumber,
      make: snapshot.normalized.make,
      vehicleModel: snapshot.normalized.model,
      registrationDate: snapshot.normalized.registrationDate || 'Unknown',
      taxPayment: snapshot.normalized.taxPayment || 'Unknown',
      engineNo: snapshot.normalized.engineNo,
      bodyType: snapshot.normalized.bodyType,
      ownerName: snapshot.normalized.ownerName,
      modelYear: snapshot.normalized.modelYear,
      seatingCapacity: snapshot.normalized.seatingCapacity || 'Unknown',
      cplc: snapshot.normalized.cplc || 'Unknown',
      safeCustody: snapshot.normalized.safeCustody || 'Unknown',
      horsePower: snapshot.normalized.horsePower || 'Unknown',
      classOfVehicle: snapshot.normalized.classOfVehicle,
      verified: snapshot.verified,
    };

    attachVehicleVerificationSnapshot(claimId, snapshot, sessionStorage.getItem('userId') || 'policyholder-demo');

    setPakistanVehicleData(verifiedVehicleData);
    setApiVerificationComplete(true);
    
    // Update fields with verified data
    setMake(verifiedVehicleData.make);
    setModel(verifiedVehicleData.vehicleModel);
    setYear(verifiedVehicleData.modelYear);
    
    // Run additional checks
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isClear = verifiedVehicleData.cplc.toLowerCase().includes('clear') &&
                    verifiedVehicleData.safeCustody.toLowerCase().includes('clear');
    
    const results = {
      stolen: !isClear,
      finance: false,
      vin: true
    };
    
    setChecksResults(results);
    setIsRunningChecks(false);
    setIsVerifyingWithAPI(false);
    setChecksComplete(true);
  };

  const handleConfirm = async () => {
    if (isMotorClaim && !registration.trim()) {
      setFeedback('Enter the registration number first.');
      return;
    }
    if (isMotorClaim && (!apiVerificationComplete || !pakistanVehicleData)) {
      setFeedback('Verify the vehicle with Excise & Taxation before continuing.');
      return;
    }

    const claimId = ensureActiveClaim();
    const existingClaim = getClaimById(claimId);
    if (existingClaim && !existingClaim.erp?.externalClaimId) {
      const erpClaim = await createErpClaim({
        claimNumber: existingClaim.claimNumber,
        insurerId: existingClaim.insurerId,
      });
      setErpCreated(claimId, erpClaim.externalClaimId, sessionStorage.getItem('userId') || 'policyholder-demo');
      const assignment = await assignErpClaim({
        externalClaimId: erpClaim.externalClaimId,
        insurerId: existingClaim.insurerId,
      });
      setAssigned(claimId, assignment.agentId, 'system');
    }

    // Store confirmed vehicle data
    const confirmedVehicle = {
      claimId,
      id: Date.now().toString(),
      name: isMotorClaim ? `${make} ${model} - ${registration}` : `${make} ${model}`,
      reg: registration.toUpperCase(),
      make,
      model,
      year,
      color,
      photo: vehicleData?.photo,
      media: vehicleData?.media, // Include all captured media
      checks: checksResults,
      pakistanVerification: isMotorClaim && apiVerificationComplete ? pakistanVehicleData : null,
      claimLine,
      confirmedAt: new Date().toISOString()
    };

    sessionStorage.setItem('selectedVehicle', confirmedVehicle.id);
    sessionStorage.setItem('selectedVehicleName', confirmedVehicle.name);
    sessionStorage.setItem('confirmedVehicleData', JSON.stringify(confirmedVehicle));

    // Initialize inspection data - moved from InspectionOverviewScreen
    let inspectionId = sessionStorage.getItem('inspectionId');
    if (!inspectionId) {
      inspectionId = Date.now().toString();
      sessionStorage.setItem('inspectionId', inspectionId);
    }
    
    // Initialize inspection data if it doesn't exist, or migrate old format
    const existingData = sessionStorage.getItem('inspectionData');
    if (!existingData) {
      sessionStorage.setItem('inspectionData', JSON.stringify({ areas: [], observations: [] }));
    } else {
      // Migrate old "issues" format to "observations" format
      const data = JSON.parse(existingData);
      if (data.issues && !data.observations) {
        data.observations = data.issues;
        delete data.issues;
        sessionStorage.setItem('inspectionData', JSON.stringify(data));
      }
      // Migrate old "rooms" to "areas"
      if (data.rooms && !data.areas) {
        data.areas = data.rooms;
        delete data.rooms;
        sessionStorage.setItem('inspectionData', JSON.stringify(data));
      }
      // Ensure observations array exists
      if (!data.observations) {
        data.observations = [];
        sessionStorage.setItem('inspectionData', JSON.stringify(data));
      }
      // Ensure areas array exists
      if (!data.areas) {
        data.areas = [];
        sessionStorage.setItem('inspectionData', JSON.stringify(data));
      }
    }

    // Store vehicle media for AI analysis
    if (vehicleData?.media && vehicleData.media.length > 0) {
      sessionStorage.setItem('vehicleMediaForAI', JSON.stringify(vehicleData.media));
    }

    // Clean up capture data
    sessionStorage.removeItem('vehicleCaptureData');

    // Navigate to AI Processing screen which will then navigate to AI Review
    navigate('/ai-processing/vehicle-initial');
  };

  if (!vehicleData) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasIssues = checksResults.stolen || checksResults.finance;

  return (
    <div className="mobile-container">
      <Box className="app-header" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h6" component="h1">
          {isMotorClaim ? 'Confirm Vehicle Details' : 'Confirm Asset Details'}
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 6 }}>
        {/* Captured Media Gallery */}
        {vehicleData.media && vehicleData.media.length > 1 && (
          <Card sx={{ boxShadow: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Captured Media
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vehicleData.media.length} items
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 1 
              }}>
                {vehicleData.media.map((media, index) => (
                  <Box 
                    key={media.id} 
                    sx={{ 
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: index === 0 ? '2px solid #9C27B0' : '1px solid #e0e0e0'
                    }}
                  >
                    <img 
                      src={media.dataUrl} 
                      alt={`Vehicle ${index + 1}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                    {index === 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          bgcolor: '#9C27B0',
                          color: '#fff',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}
                      >
                        PRIMARY
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* AI Detected Information */}
        <Card sx={{ boxShadow: 2, mb: 3, bgcolor: '#f1f8fc' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                AI Detected Information
              </Typography>
              <Button
                variant="text"
                size="small"
                startIcon={<Edit2 size={16} />}
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                sx={{ 
                  color: '#9C27B0',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                {isEditingDetails ? 'Done' : 'Edit'}
              </Button>
            </Box>
            
            {!isEditingDetails ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Make</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {make}
                    </Typography>
                    <Chip 
                      label={`${vehicleData.aiDetected.confidence.make}%`} 
                      size="small" 
                      sx={{ 
                        bgcolor: vehicleData.aiDetected.confidence.make >= 90 ? '#d4edda' : '#fff3cd',
                        color: vehicleData.aiDetected.confidence.make >= 90 ? '#155724' : '#856404',
                        fontWeight: 600,
                        height: 24
                      }} 
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Model</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {model}
                    </Typography>
                    <Chip 
                      label={`${vehicleData.aiDetected.confidence.model}%`} 
                      size="small" 
                      sx={{ 
                        bgcolor: vehicleData.aiDetected.confidence.model >= 90 ? '#d4edda' : '#fff3cd',
                        color: vehicleData.aiDetected.confidence.model >= 90 ? '#155724' : '#856404',
                        fontWeight: 600,
                        height: 24
                      }} 
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Color</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {color}
                    </Typography>
                    <Chip 
                      label={`${vehicleData.aiDetected.confidence.color}%`} 
                      size="small" 
                      sx={{ 
                        bgcolor: vehicleData.aiDetected.confidence.color >= 90 ? '#d4edda' : '#fff3cd',
                        color: vehicleData.aiDetected.confidence.color >= 90 ? '#155724' : '#856404',
                        fontWeight: 600,
                        height: 24
                      }} 
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Year</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {year}
                  </Typography>
                </Box>

                {isMotorClaim && registration && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Registration</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {registration}
                      </Typography>
                      {vehicleData.aiDetected.registration && (
                        <Chip 
                          label={`${vehicleData.aiDetected.confidence.registration}%`} 
                          size="small" 
                          sx={{ 
                            bgcolor: vehicleData.aiDetected.confidence.registration >= 90 ? '#d4edda' : '#fff3cd',
                            color: vehicleData.aiDetected.confidence.registration >= 90 ? '#155724' : '#856404',
                            fontWeight: 600,
                            height: 24
                          }} 
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Vehicle Verification Button - Only show if not verified yet */}
                {isMotorClaim && !apiVerificationComplete && registration.trim() && (
                  <Button
                    variant="outlined"
                    fullWidth
                    size="medium"
                    onClick={runVehicleChecks}
                    disabled={isVerifyingWithAPI}
                    sx={{ 
                      mt: 2,
                      py: 1.5, 
                      fontWeight: 600,
                      borderColor: '#9C27B0',
                      color: '#9C27B0'
                    }}
                  >
                    {isVerifyingWithAPI ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={18} sx={{ color: '#9C27B0' }} />
                        <span>Verifying with Excise & Taxation...</span>
                      </Box>
                    ) : (
                      'Verify with Excise & Taxation'
                    )}
                  </Button>
                )}

                {/* Show verified badge if verification is complete */}
                {isMotorClaim && apiVerificationComplete && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 1.5, 
                    bgcolor: '#d4edda', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CheckCircle2 size={18} color="#155724" />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#155724' }}>
                      Verified with Excise & Taxation
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {isMotorClaim && (
                  <TextField
                    label="Registration Number *"
                    value={registration}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length > 3) {
                        value = value.slice(0, 3) + '-' + value.slice(3, 7);
                      }
                      setRegistration(value);
                    }}
                    fullWidth
                    placeholder="LED-2345"
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      maxLength: 8,
                      style: { textTransform: 'uppercase' }
                    }}
                    helperText="Format: ABC-1234 (3 letters + 4 digits)"
                  />
                )}

                <TextField
                  label={isMotorClaim ? 'Make' : 'Asset Category'}
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label={isMotorClaim ? 'Model' : 'Asset Type / Model'}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={isMotorClaim ? 'Year' : 'Manufacture / Build Year'}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label={isMotorClaim ? 'Color' : 'Condition / Finish'}
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Pakistani Vehicle Verification Data (Excise & Taxation API) */}
        {isMotorClaim && apiVerificationComplete && pakistanVehicleData && (
          <Card sx={{ boxShadow: 2, mb: 3, border: '2px solid #4CAF50' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                  Vehicle Verification
                </Typography>
                <Chip 
                  icon={<CheckCircle2 size={16} />}
                  label="Verified" 
                  size="small" 
                  sx={{ bgcolor: '#d4edda', color: '#155724', fontWeight: 600 }}
                />
              </Box>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Vehicle successfully verified with Pakistan Excise & Taxation Department
                </Typography>
              </Alert>

              {/* Table-like layout */}
              <Box sx={{ 
                border: '1px solid #e0e0e0',
                overflow: 'hidden'
              }}>
                {/* Registration No - Highlighted */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#f3e5f5'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Registration No
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                      {pakistanVehicleData.registrationNo}
                    </Typography>
                  </Box>
                </Box>

                {/* Make */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#fff'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Make
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.make}
                    </Typography>
                  </Box>
                </Box>

                {/* Vehicle Model */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#f9f9f9'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Vehicle Model
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.vehicleModel}
                    </Typography>
                  </Box>
                </Box>

                {/* Model Year */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#fff'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Model Year
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.modelYear}
                    </Typography>
                  </Box>
                </Box>

                {/* Body Type */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#f9f9f9'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Body Type
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.bodyType}
                    </Typography>
                  </Box>
                </Box>

                {/* Engine No */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#fff'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Engine No
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.engineNo}
                    </Typography>
                  </Box>
                </Box>

                {/* Owner Name */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#f9f9f9'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Owner Name
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.ownerName}
                    </Typography>
                  </Box>
                </Box>

                {/* Registration Date */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#fff'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Registration Date
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.registrationDate}
                    </Typography>
                  </Box>
                </Box>

                {/* Tax Payment */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#f9f9f9'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Tax Payment
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.taxPayment}
                    </Typography>
                  </Box>
                </Box>

                {/* Seating Capacity */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#fff'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Seating Capacity
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.seatingCapacity}
                    </Typography>
                  </Box>
                </Box>

                {/* Horse Power */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#f9f9f9'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Horse Power
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.horsePower}
                    </Typography>
                  </Box>
                </Box>

                {/* Class of Vehicle */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: '#fff'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Class of Vehicle
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pakistanVehicleData.classOfVehicle}
                    </Typography>
                  </Box>
                </Box>

                {/* CPLC Status - Highlighted in green */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  borderBottom: '1px solid #4CAF50',
                  bgcolor: '#d4edda'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #4CAF50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#155724' }}>
                      CPLC Status
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#155724' }}>
                      {pakistanVehicleData.cplc}
                    </Typography>
                  </Box>
                </Box>

                {/* Safe Custody - Highlighted in green */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40% 60%',
                  bgcolor: '#d4edda'
                }}>
                  <Box sx={{ p: 1.5, borderRight: '1px solid #4CAF50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#155724' }}>
                      Safe Custody
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#155724' }}>
                      {pakistanVehicleData.safeCustody}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Confirm Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleConfirm}
          disabled={isMotorClaim ? !registration.trim() : !make.trim() || !model.trim()}
          sx={{ py: 2, fontWeight: 600 }}
        >
          {isMotorClaim ? 'Start inspection' : 'Start asset assessment'}
        </Button>
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
