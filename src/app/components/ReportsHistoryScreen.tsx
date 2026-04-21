import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, Card, CardContent, Chip, Container, IconButton, Typography } from '@mui/material';
import { ArrowLeft, ChevronRight, Clock3, FileText, ShieldCheck } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { Claim, ClaimState } from '../domain/claims/types';
import { getClaimsStore } from '../domain/claims/service';

interface SavedClaimReport {
  id: string;
  claimId?: string | null;
  claimNumber?: string | null;
  claimState?: ClaimState | null;
  vehicleName: string;
  inspectionType: string;
  claimLine?: string;
  date: string;
  observationsCount?: number;
  submittedObservationsIds?: string[];
  submittedByUserId?: string;
  submittedByRole?: string;
  submissionMode?: string;
}

function getClaimLineFromLossType(lossType: string) {
  if (['collision', 'third-party', 'theft', 'roadside-incident'].includes(lossType)) return 'motor';
  if (['fire-damage', 'flood-water', 'burglary'].includes(lossType)) return 'property';
  if (['accidental-device-damage', 'device-theft', 'liquid-damage'].includes(lossType)) return 'device';
  if (['equipment-breakdown', 'factory-fire', 'plant-asset-damage'].includes(lossType)) return 'industrial';
  return 'motor';
}

export default function ReportsHistoryScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const userId = sessionStorage.getItem('userId') || 'policyholder-demo';
  const store = getClaimsStore();
  const [reports, setReports] = useState<SavedClaimReport[]>([]);

  useEffect(() => {
    try {
      setReports(JSON.parse(localStorage.getItem('savedReports') || '[]'));
    } catch {
      setReports([]);
    }
  }, []);

  const agentAssignedClaims = useMemo(
    () => store.claims.filter((claim) => claim.assignedAgentId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [store.claims, userId]
  );

  const submittedByAgent = useMemo(
    () =>
      reports
        .filter(
          (report) =>
            report.submittedByUserId === userId &&
            report.submittedByRole === 'field-agent' &&
            (report.submittedObservationsIds || []).length > 0
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [reports, userId]
  );

  const pendingAgentAction = useMemo(
    () => agentAssignedClaims.filter((claim) => claim.state === 'ASSIGNED' || claim.state === 'INFO_REQUESTED'),
    [agentAssignedClaims]
  );

  const policyholderStats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((item) => item.claimState && item.claimState !== 'CLOSED').length;
    const submitted = reports.filter((item) => (item.submittedObservationsIds || []).length > 0).length;
    return { total, open, submitted };
  }, [reports]);

  const launchAssessment = (claim: Claim, mode: 'agent' | 'agent-context') => {
    sessionStorage.setItem('activeClaimId', claim.id);
    sessionStorage.setItem('claimLine', getClaimLineFromLossType(claim.lossType));
    sessionStorage.setItem('inspectionType', claim.lossType);
    sessionStorage.setItem('assessmentMode', mode);
    navigate('/vehicle-capture');
  };

  if (role === 'field-agent') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
            <ArrowLeft size={22} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Assigned Claims Workspace
          </Typography>
        </Box>

        <Container sx={{ py: 3, pb: 4 }}>
          <Alert severity="info" sx={{ mb: 2.5 }}>
            New assignments and information requests from back-office appear here. Field agents only submit assessments against assigned claims.
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.2, mb: 2.5 }}>
            <Card>
              <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {agentAssignedClaims.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assigned
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {pendingAgentAction.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Action Needed
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {submittedByAgent.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.3 }}>
            New / Active Assignments
          </Typography>
          {agentAssignedClaims.length === 0 ? (
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No claims are assigned to your field profile yet.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3, mb: 3 }}>
              {agentAssignedClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {claim.claimNumber}
                      </Typography>
                      <Chip size="small" label={CLAIM_STATE_LABELS[claim.state]} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.2 }}>
                      Last updated: {new Date(claim.updatedAt).toLocaleString()}
                    </Typography>
                    {claim.state === 'INFO_REQUESTED' ? (
                      <Button size="small" variant="contained" onClick={() => launchAssessment(claim, 'agent-context')}>
                        Add Requested Context
                      </Button>
                    ) : (
                      <Button size="small" variant="contained" onClick={() => launchAssessment(claim, 'agent')}>
                        Start On-Site Assessment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.3 }}>
            Submitted Assessments
          </Typography>
          {submittedByAgent.length === 0 ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  You have not submitted any assessments yet.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {submittedByAgent.map((report) => (
                <Card key={report.id} onClick={() => navigate(`/report/${report.id}`)} sx={{ cursor: 'pointer' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {report.claimNumber || `CLAIM-${report.id.slice(-5)}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(report.submissionMode || 'agent') === 'agent-context' ? 'Context Update Submitted' : 'On-Site Assessment Submitted'}
                        </Typography>
                      </Box>
                      <ChevronRight size={18} color="#64748B" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Clock3 size={14} color="#64748B" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(report.date).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip size="small" icon={<ShieldCheck size={14} />} label={report.claimState ? CLAIM_STATE_LABELS[report.claimState] : 'Submitted'} />
                    </Box>
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
          <ArrowLeft size={22} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Claims and Reports
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.2, mb: 2.5 }}>
          <Card>
            <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {policyholderStats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {policyholderStats.open}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Open
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ p: 1.6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {policyholderStats.submitted}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {reports.length === 0 ? (
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <FileText size={52} style={{ color: '#94A3B8', marginBottom: 14 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No claims yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start a new FNOL claim from the dashboard to populate this workspace.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/inspection-type')}>
                Create New Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {reports
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((report) => (
                <Card key={report.id} onClick={() => navigate(`/report/${report.id}`)} sx={{ cursor: 'pointer' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {report.claimNumber || `CLAIM-${report.id.slice(-5)}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.vehicleName || 'Asset not specified'}
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
