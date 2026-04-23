import { useNavigate } from 'react-router';
import { Box, Card, CardContent, Container, Typography } from '@mui/material';
import { CarFront, UserRound } from 'lucide-react';

const PERSONAS = [
  {
    id: 'policyholder',
    title: 'Policyholder',
    subtitle: 'Report a claim and track progress',
    description: 'Create accident claims, upload evidence, respond to insurer requests, and follow approval/payment status.',
    icon: UserRound,
    color: '#8B0037',
  },
  {
    id: 'field-agent',
    title: 'Field Agent',
    subtitle: 'Assess assigned claims on site',
    description: 'Capture photos, verify damage details, and submit field assessments linked to existing insurer claims.',
    icon: CarFront,
    color: '#BC9633',
  },
];

export default function PersonaGatewayScreen() {
  const navigate = useNavigate();

  const handleSelect = (persona: string) => {
    sessionStorage.setItem('selectedPersona', persona);
    navigate('/login');
  };

  return (
    <div className="mobile-container" style={{ minHeight: '100vh' }}>
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 10% 10%, rgba(139,0,55,0.12), transparent 35%), radial-gradient(circle at 90% 20%, rgba(188,150,51,0.12), transparent 35%), #F7F9FC',
          py: 5,
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
            PQGTL Insurace
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Select Your App Experience
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose the correct persona before sign-in so the app opens the right workflow.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            {PERSONAS.map((persona) => {
              const Icon = persona.icon;
              return (
                <Card
                  key={persona.id}
                  onClick={() => handleSelect(persona.id)}
                  sx={{
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: '1px solid #E2E8F0',
                    '&:active': { transform: 'scale(0.99)' },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.6 }}>
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: 2,
                          bgcolor: `${persona.color}1A`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={22} color={persona.color} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {persona.title}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {persona.subtitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {persona.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Container>
      </Box>
    </div>
  );
}
