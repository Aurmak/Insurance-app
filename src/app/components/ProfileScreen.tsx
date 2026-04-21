import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Avatar, Box, Button, Card, CardContent, Chip, Container, Typography } from '@mui/material';
import { Database, LogOut, Shield, UserRound } from 'lucide-react';
import BottomNavigation from './BottomNavigation';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const email = sessionStorage.getItem('userEmail') || 'demo@insurer.pk';
  const insurerId = sessionStorage.getItem('insurerId') || 'insurer-demo';

  const roleLabel = useMemo(() => {
    if (role === 'field-agent') return 'Field Agent';
    return 'Policyholder';
  }, [role]);

  const logout = () => {
    sessionStorage.clear();
    localStorage.setItem('isLoggedIn', 'false');
    navigate('/login');
  };

  return (
    <div className="mobile-container with-bottom-nav">
      <Box className="app-header">
        <Container sx={{ py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Account and Access
          </Typography>
        </Container>
      </Box>

      <Container sx={{ py: 3 }}>
        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 78, height: 78, mx: 'auto', mb: 2, bgcolor: '#0B5CAD' }}>
              <UserRound size={38} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {roleLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.3 }}>
              {email}
            </Typography>
            <Chip icon={<Shield size={14} />} label={`Insurer: ${insurerId}`} size="small" />
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Persona Lock
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Persona is selected before login and enforced after sign-in. Use sign out to change persona.
            </Typography>
            <Button variant="outlined" fullWidth onClick={() => navigate('/persona-select')}>
              Change Persona
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Integration Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Chip icon={<Database size={14} />} label="Customs/Excise: Connected (Demo Stub)" />
              <Chip icon={<Database size={14} />} label="Insurer ERP Adapter: Connected (Demo Stub)" />
            </Box>
          </CardContent>
        </Card>

        <Button variant="outlined" color="error" fullWidth startIcon={<LogOut size={18} />} onClick={logout}>
          Sign Out
        </Button>
      </Container>

      <BottomNavigation />
    </div>
  );
}
