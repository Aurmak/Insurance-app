import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, Card, CardContent, Chip, Container, Typography } from '@mui/material';
import { ArrowRight, BellRing, Clock3, FilePlus2, ShieldCheck, TriangleAlert } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import OfflineIndicator from './OfflineIndicator';
import { getClaimTimeline, getClaimsStore } from '../domain/claims/service';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';

function getRoleLabel(role: string): string {
  if (role === 'field-agent') return 'Field Agent';
  return 'Policyholder';
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const userId = sessionStorage.getItem('userId') || 'policyholder-demo';
  const store = getClaimsStore();
  const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
  const assignedClaims = store.claims.filter((item) => item.assignedAgentId === userId);
  const policyholderClaims = store.claims.filter((item) => item.createdByUserId === userId);

  const metrics = useMemo(() => {
    if (role === 'field-agent') {
      const totalClaims = assignedClaims.length;
      const activeClaims = assignedClaims.filter((item) => item.state !== 'CLOSED').length;
      const pendingApprovals = assignedClaims.filter((item) => item.state === 'ASSIGNED').length;
      const infoRequests = assignedClaims.filter((item) => item.state === 'INFO_REQUESTED').length;
      return { totalClaims, activeClaims, pendingApprovals, infoRequests };
    }
    const totalClaims = store.claims.length;
    const activeClaims = policyholderClaims.filter((item) => item.state !== 'CLOSED').length;
    const pendingApprovals = policyholderClaims.filter((item) => item.state === 'PAID').length;
    const infoRequests = policyholderClaims.filter((item) => item.state === 'REJECTED').length;
    return { totalClaims, activeClaims, pendingApprovals, infoRequests };
  }, [assignedClaims, policyholderClaims, role, store.claims]);

  const latestClaims = [...(role === 'field-agent' ? assignedClaims : policyholderClaims)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const newAssignments = useMemo(
    () =>
      assignedClaims.filter((claim) => {
        const timeline = getClaimTimeline(claim.id);
        const hasSubmittedByAgent = timeline.some(
          (event) => event.eventType.includes('ASSESSMENT_SUBMITTED') && event.actorUserId === userId
        );
        return claim.state === 'ASSIGNED' && !hasSubmittedByAgent;
      }),
    [assignedClaims, userId]
  );

  return (
    <div className="mobile-container with-bottom-nav">
      <OfflineIndicator />

      <Box className="app-header" sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ letterSpacing: 1.1, color: 'text.secondary' }}>
          Pakistan Insurance Claims
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Welcome, {getRoleLabel(role)}
        </Typography>
      </Box>

      <Container sx={{ py: 3 }}>
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #3B82F6 100%)',
            color: '#fff',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {role === 'field-agent' ? 'Field Assessment Console' : 'Policyholder Claims Console'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#EAF1FF', mb: 2 }}>
              {role === 'field-agent'
                ? 'Open assigned claims, capture on-site evidence, and submit findings to insurer ERP.'
                : 'Report motor, property, device, or industrial claims and track progress from FNOL to settlement.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate(role === 'field-agent' ? '/reports-history' : '/inspection-type')}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.88)',
                bgcolor: 'rgba(15, 23, 42, 0.16)',
                '&:hover': {
                  borderColor: '#FFFFFF',
                  bgcolor: 'rgba(15, 23, 42, 0.24)',
                },
              }}
              startIcon={<FilePlus2 size={18} />}
            >
              {role === 'field-agent' ? 'Open Assigned Claims' : 'Start New Claim'}
            </Button>
          </CardContent>
        </Card>
        {role === 'field-agent' && newAssignments.length > 0 && (
          <Alert severity="info" sx={{ mb: 2.5 }}>
            New assignment received: {newAssignments.length} claim{newAssignments.length > 1 ? 's' : ''} waiting for onsite assessment.
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5, mb: 3 }}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Active Claims
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {metrics.activeClaims}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {role === 'field-agent' ? 'Assessments Pending' : 'Paid'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {metrics.pendingApprovals}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {role === 'field-agent' ? 'Info Requests' : 'Rejected'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {metrics.infoRequests}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {role === 'field-agent' ? 'My Submissions' : 'Total Reports'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {role === 'field-agent'
                  ? savedReports.filter((item: any) => item.submittedByUserId === userId && (item.submittedObservationsIds || []).length > 0).length
                  : policyholderClaims.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Priority Worklist
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button variant="outlined" fullWidth onClick={() => navigate('/reports-history')} endIcon={<ArrowRight size={18} />}>
                {role === 'field-agent' ? 'View Assigned Claims' : 'View All Claims and Reports'}
              </Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/reports-history')} startIcon={<BellRing size={18} />}>
                {role === 'field-agent' ? 'Claims Requiring Visit' : 'Pending Information Requests'}
              </Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/reports-history')} startIcon={<ShieldCheck size={18} />}>
                {role === 'field-agent' ? 'Assessments Submitted by Me' : 'Verification and Assignment Status'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Latest Claim Activity
        </Typography>
        {latestClaims.length === 0 ? (
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                No claim activity yet. Start a new claim to begin the workflow demo.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {latestClaims.map((claim) => (
              <Card key={claim.id} onClick={() => navigate('/reports-history')} sx={{ borderRadius: 2.5, cursor: 'pointer' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {claim.claimNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {claim.policyNumber} • {new Date(claim.updatedAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={CLAIM_STATE_LABELS[claim.state]}
                      size="small"
                      color={claim.state === 'INFO_REQUESTED' ? 'warning' : claim.state === 'REJECTED' ? 'error' : 'default'}
                      icon={claim.state === 'INFO_REQUESTED' ? <TriangleAlert size={14} /> : <Clock3 size={14} />}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      <BottomNavigation />
    </div>
  );
}
