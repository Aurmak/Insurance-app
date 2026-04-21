import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Container, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ProcessingStep {
  label: string;
  duration: number;
  completed: boolean;
}

function getProcessingSteps(claimLine: string): ProcessingStep[] {
  if (claimLine === 'property') {
    return [
      { label: 'Loading property evidence...', duration: 800, completed: false },
      { label: 'Assessing structural impact...', duration: 1200, completed: false },
      { label: 'Detecting fire/water intrusion patterns...', duration: 1000, completed: false },
      { label: 'Reviewing affected fixtures & contents...', duration: 900, completed: false },
      { label: 'Scoring severity and recoverability...', duration: 800, completed: false },
      { label: 'Generating observations...', duration: 1000, completed: false },
    ];
  }

  if (claimLine === 'device') {
    return [
      { label: 'Loading device photos...', duration: 800, completed: false },
      { label: 'Analyzing external damage...', duration: 1100, completed: false },
      { label: 'Identifying screen/body impact points...', duration: 1000, completed: false },
      { label: 'Evaluating functionality risk...', duration: 900, completed: false },
      { label: 'Estimating repairability...', duration: 800, completed: false },
      { label: 'Generating observations...', duration: 1000, completed: false },
    ];
  }

  if (claimLine === 'industrial') {
    return [
      { label: 'Loading industrial incident evidence...', duration: 800, completed: false },
      { label: 'Analyzing equipment/plant impact...', duration: 1300, completed: false },
      { label: 'Detecting operational risk indicators...', duration: 1000, completed: false },
      { label: 'Reviewing safety-critical components...', duration: 900, completed: false },
      { label: 'Estimating downtime exposure...', duration: 800, completed: false },
      { label: 'Generating observations...', duration: 1000, completed: false },
    ];
  }

  return [
    { label: 'Loading vehicle images...', duration: 800, completed: false },
    { label: 'Analyzing vehicle condition...', duration: 1200, completed: false },
    { label: 'Detecting body damage...', duration: 1000, completed: false },
    { label: 'Checking tire condition...', duration: 900, completed: false },
    { label: 'Reviewing glass & lights...', duration: 800, completed: false },
    { label: 'Generating observations...', duration: 1000, completed: false },
  ];
}

export default function AIProcessingScreen() {
  const navigate = useNavigate();
  const { targetId } = useParams(); // e.g., "vehicle-initial"
  const claimLine = sessionStorage.getItem('claimLine') || 'motor';
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>(getProcessingSteps(claimLine));

  useEffect(() => {
    // Check if we have vehicle data
    const vehicleMediaStr = sessionStorage.getItem('vehicleMediaForAI');
    const confirmedVehicleStr = sessionStorage.getItem('confirmedVehicleData');
    
    if (!vehicleMediaStr || !confirmedVehicleStr) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Start the processing animation
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        // Animate progress for this step
        const stepDuration = steps[i].duration;
        const startTime = Date.now();
        
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const stepProgress = Math.min((elapsed / stepDuration) * 100, 100);
          setProgress(stepProgress);
          
          if (stepProgress >= 100) {
            clearInterval(progressInterval);
          }
        }, 50);

        await new Promise(resolve => setTimeout(resolve, stepDuration));
        clearInterval(progressInterval);
        
        // Mark step as completed
        setSteps(prev => prev.map((step, idx) => 
          idx === i ? { ...step, completed: true } : step
        ));
        setProgress(100);
        
        // Small pause between steps
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // All steps complete, navigate to AI review
      setTimeout(() => {
        navigate(`/ai-review/${targetId || 'vehicle-initial'}`, { replace: true });
      }, 500);
    };

    processSteps();
  }, [navigate, targetId]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center' }}>
      <Container sx={{ py: 4 }}>
        {/* AI Icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#9C27B0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
                '50%': {
                  transform: 'scale(1.05)',
                  opacity: 0.9,
                },
              },
            }}
          >
            <Sparkles size={40} color="#fff" />
          </Box>
        </Box>

        {/* Main Title */}
        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center', 
            fontWeight: 700, 
            mb: 1,
            color: '#9C27B0'
          }}
        >
          AI Analysis in Progress
        </Typography>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ textAlign: 'center', mb: 4 }}
        >
          Please wait while we analyze your claim evidence
        </Typography>

        {/* Processing Steps */}
        <Box sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Box 
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2.5,
                opacity: index <= currentStep ? 1 : 0.3,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* Step Indicator */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: step.completed ? '#4CAF50' : index === currentStep ? '#9C27B0' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0,
                  transition: 'background-color 0.3s ease',
                }}
              >
                {step.completed ? (
                  <CheckCircle2 size={20} color="#fff" />
                ) : index === currentStep ? (
                  <CircularProgress size={16} sx={{ color: '#fff' }} />
                ) : (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#fff',
                    }}
                  />
                )}
              </Box>

              {/* Step Label */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: index === currentStep ? 600 : 400,
                    color: step.completed ? '#4CAF50' : index === currentStep ? '#9C27B0' : 'text.secondary',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {step.label}
                </Typography>
                
                {/* Progress bar for current step */}
                {index === currentStep && !step.completed && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#9C27B0',
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Overall Progress */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
