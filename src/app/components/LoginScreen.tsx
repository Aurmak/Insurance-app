import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, Container, Typography } from '@mui/material';
import { ShieldCheck } from 'lucide-react';
import { seedDemoAssignedClaimsForAgent } from '../domain/claims/service';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const selectedPersona = sessionStorage.getItem('selectedPersona');

  useEffect(() => {
    if (!selectedPersona) {
      navigate('/persona-select', { replace: true });
    }
  }, [navigate, selectedPersona]);

  const personaLabel = useMemo(() => {
    if (selectedPersona === 'field-agent') return 'Field Agent';
    return 'Policyholder';
  }, [selectedPersona]);

  const handleLogin = () => {
    const role = selectedPersona || 'policyholder';
    const nextUserId = role === 'field-agent' ? 'agent-pk-001' : `demo-${role}`;
    localStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userEmail', email || 'demo@insurer.pk');
    sessionStorage.setItem('insurerId', 'insurer-demo');
    sessionStorage.setItem('userId', nextUserId);
    if (role === 'field-agent') {
      seedDemoAssignedClaimsForAgent(nextUserId, 'insurer-demo');
    }
    navigate('/dashboard');
  };

  return (
    <div className="mobile-container" style={{ minHeight: '100vh' }}>
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 10% 10%, rgba(156,39,176,0.12), transparent 35%), radial-gradient(circle at 90% 20%, rgba(33,150,243,0.12), transparent 35%), #F7F9FC',
          display: 'flex',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                bgcolor: '#0B5CAD',
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(11,92,173,0.22)',
              }}
            >
              <ShieldCheck size={34} color="#fff" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              ClaimFlow Pakistan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to the {personaLabel} experience.
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 4, boxShadow: '0 20px 40px rgba(15,23,42,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Sign in to continue
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: '#EFF6FF' }}>
                  <Typography variant="caption" color="text.secondary">
                    Selected Persona
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {personaLabel}
                  </Typography>
                </Box>
                <input
                  aria-label="Work Email"
                  placeholder="claims@insurer.pk"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid #CBD5E1',
                    borderRadius: 12,
                    padding: '14px 16px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
                <Button variant="contained" size="large" sx={{ py: 1.4, mt: 1 }} onClick={handleLogin}>
                  Continue
                </Button>
                <Button variant="text" onClick={() => navigate('/persona-select')}>
                  Change Persona
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            Demo login is passwordless for client walkthroughs.
          </Typography>
        </Container>
      </Box>
    </div>
  );
}
