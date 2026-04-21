import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Card, CardContent, Chip, Container, IconButton, Typography } from '@mui/material';
import { AlertTriangle, ArrowLeft, Car, ShieldAlert, UserRoundX } from 'lucide-react';

const CLAIM_LINES = [
  { id: 'motor', label: 'Motor' },
  { id: 'property', label: 'Property' },
  { id: 'device', label: 'Device / Gadget' },
  { id: 'industrial', label: 'Industrial / Factory' },
];

const CLAIM_TYPES_BY_LINE = {
  motor: [
    {
      id: 'collision',
      title: 'Accident Damage Claim',
      description: 'Vehicle collision or impact damage requiring survey and repair.',
      icon: Car,
    },
    {
      id: 'third-party',
      title: 'Third-Party Liability',
      description: 'Claims involving third-party property or bodily injury liability.',
      icon: ShieldAlert,
    },
    {
      id: 'theft',
      title: 'Theft / Total Loss',
      description: 'Vehicle theft, missing vehicle report, or total loss processing.',
      icon: UserRoundX,
    },
    {
      id: 'roadside-incident',
      title: 'Roadside Incident',
      description: 'Minor incidents requiring recovery, towing, or immediate support.',
      icon: AlertTriangle,
    },
  ],
  property: [
    {
      id: 'fire-damage',
      title: 'Fire / Smoke Damage',
      description: 'Residential or commercial property damage due to fire or smoke.',
      icon: AlertTriangle,
    },
    {
      id: 'flood-water',
      title: 'Flood / Water Damage',
      description: 'Water ingress, flooding, or burst pipeline related losses.',
      icon: ShieldAlert,
    },
    {
      id: 'burglary',
      title: 'Burglary / Break-in',
      description: 'Theft or forced entry causing property and asset damage.',
      icon: UserRoundX,
    },
  ],
  device: [
    {
      id: 'accidental-device-damage',
      title: 'Accidental Damage',
      description: 'Screen, body, or hardware accidental damage claims.',
      icon: AlertTriangle,
    },
    {
      id: 'device-theft',
      title: 'Device Theft',
      description: 'Lost or stolen mobile, laptop, or insured electronics.',
      icon: UserRoundX,
    },
    {
      id: 'liquid-damage',
      title: 'Liquid Damage',
      description: 'Water or liquid damage to device internals and components.',
      icon: ShieldAlert,
    },
  ],
  industrial: [
    {
      id: 'equipment-breakdown',
      title: 'Equipment Breakdown',
      description: 'Machinery failure or operational breakdown assessment.',
      icon: Car,
    },
    {
      id: 'factory-fire',
      title: 'Factory Fire Loss',
      description: 'Fire-related plant, stock, and structural loss claims.',
      icon: AlertTriangle,
    },
    {
      id: 'plant-asset-damage',
      title: 'Plant / Asset Damage',
      description: 'Physical damage to insured assets and production units.',
      icon: ShieldAlert,
    },
  ],
};

export default function InspectionTypeScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const [selectedLine, setSelectedLine] = useState(sessionStorage.getItem('claimLine') || 'motor');

  const handleSelect = (claimType: string) => {
    sessionStorage.setItem('inspectionType', claimType);
    sessionStorage.removeItem('assessmentMode');
    navigate('/vehicle-capture');
  };

  const handleLineSelect = (line: string) => {
    sessionStorage.setItem('claimLine', line);
    sessionStorage.removeItem('inspectionType');
    setSelectedLine(line);
  };

  const claimTypes = CLAIM_TYPES_BY_LINE[selectedLine as keyof typeof CLAIM_TYPES_BY_LINE] || CLAIM_TYPES_BY_LINE.motor;

  return (
    <div className="mobile-container">
      <Box className="app-header" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton edge="start" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
          {role === 'field-agent' ? 'Assessment Intake' : 'New Claim Intake'}
        </Typography>
      </Box>

      <Container sx={{ py: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Insurance Line
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
          {CLAIM_LINES.map((line) => (
            <Chip
              key={line.id}
              label={line.label}
              color={line.id === selectedLine ? 'primary' : 'default'}
              onClick={() => handleLineSelect(line.id)}
              variant={line.id === selectedLine ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {role === 'field-agent'
            ? 'Select the assessment category and attach findings to the assigned claim.'
            : 'Select claim type to start FNOL and route the case to the correct insurer workflow.'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {claimTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                onClick={() => handleSelect(type.id)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '1px solid #E5E7EB',
                  '&:active': { transform: 'scale(0.985)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: '#E8F1FD',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} color="#0B5CAD" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {type.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>
    </div>
  );
}
