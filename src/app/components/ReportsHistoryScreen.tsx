import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, Chip, Container, IconButton, Typography } from '@mui/material';
import { ArrowLeft, ChevronRight, Clock3, FileText, ShieldCheck } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { ClaimState } from '../domain/claims/types';

interface SavedClaimReport {
  id: string;
  claimId?: string | null;
  claimNumber?: string | null;
  claimState?: ClaimState | null;
  vehicleName: string;
  inspectionType: string;
  date: string;
  observationsCount?: number;
  submittedObservationsIds?: string[];
}

export default function ReportsHistoryScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const [reports, setReports] = useState<SavedClaimReport[]>([]);

  useEffect(() => {
    try {
      setReports(JSON.parse(localStorage.getItem('savedReports') || '[]'));
    } catch {
      setReports([]);
    }
  }, []);

  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((item) => item.claimState && item.claimState !== 'CLOSED').length;
    const submitted = reports.filter((item) => (item.submittedObservationsIds || []).length > 0).length;
    return { total, open, submitted };
  }, [reports]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
          <ArrowLeft size={22} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {role === 'field-agent' ? 'Assigned Claims' : 'Claims and Reports'}
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.2, mb: 2.5 }}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {stats.open}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Open
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {stats.submitted}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {reports.length === 0 ? (
          <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <FileText size={52} style={{ color: '#94A3B8', marginBottom: 14 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No claims yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {role === 'field-agent'
                  ? 'Assigned claims will appear here once dispatch is completed from ERP.'
                  : 'Start a new FNOL claim from the dashboard to populate this workspace.'}
              </Typography>
              {role === 'field-agent' ? (
                <Button variant="contained" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              ) : (
                <Button variant="contained" onClick={() => navigate('/inspection-type')}>
                  Create New Claim
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {reports
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((report) => (
                <Card key={report.id} onClick={() => navigate(`/report/${report.id}`)} sx={{ borderRadius: 2.5, cursor: 'pointer' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {report.claimNumber || `CLAIM-${report.id.slice(-5)}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.vehicleName || 'Vehicle not specified'}
                        </Typography>
                      </Box>
                      <ChevronRight size={20} color="#64748B" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Clock3 size={14} color="#64748B" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(report.date).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={<ShieldCheck size={14} />}
                        label={report.claimState ? CLAIM_STATE_LABELS[report.claimState] : 'Saved'}
                        color={report.claimState === 'REJECTED' ? 'error' : report.claimState === 'CLOSED' ? 'success' : 'default'}
                      />
                    </Box>
                    {role === 'field-agent' && (
                      <Button
                        size="small"
                        sx={{ mt: 1.2 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (report.claimId) sessionStorage.setItem('activeClaimId', report.claimId);
                          sessionStorage.setItem('assessmentMode', 'agent');
                          navigate('/vehicle-capture');
                        }}
                      >
                        Start On-Site Assessment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
          </Box>
        )}
      </Container>

      <BottomNavigation />
    </Box>
  );
}
