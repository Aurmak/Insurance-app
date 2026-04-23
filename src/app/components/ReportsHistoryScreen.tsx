import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, Chip, Container, IconButton, Typography } from '@mui/material';
import { ArrowLeft, ChevronRight, Clock3, FileText, ShieldCheck } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { Claim, ClaimState } from '../domain/claims/types';
import { getClaimsStore, seedDemoAssignedClaimsForAgent, seedDemoPolicyholderEvidenceReports, seedDemoPolicyholderOutcomeClaims } from '../domain/claims/service';

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

interface PolicyholderListEntry {
  id: string;
  routeId: string;
  claimNumber: string;
  assetName: string;
  date: string;
  claimState: ClaimState | null;
}

const POLICYHOLDER_PENDING_STATES: ClaimState[] = [
  'DRAFT',
  'FNOL_SUBMITTED',
  'VEHICLE_VERIFIED',
  'ERP_CREATED',
  'ASSIGNED',
  'INVESTIGATION_IN_PROGRESS',
  'INFO_REQUESTED',
  'INFO_RECEIVED',
  'ESTIMATE_PENDING',
  'ESTIMATE_SUBMITTED',
  'APPROVAL_PENDING',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REPAIR_IN_PROGRESS',
  'REPAIR_COMPLETED',
  'SETTLEMENT_PREPARED',
  'PAYMENT_IN_PROGRESS',
];

function getClaimLineFromLossType(lossType: string) {
  if (['collision', 'third-party', 'theft', 'roadside-incident'].includes(lossType)) return 'motor';
  if (['fire-damage', 'flood-water', 'burglary'].includes(lossType)) return 'property';
  if (['accidental-device-damage', 'device-theft', 'liquid-damage'].includes(lossType)) return 'device';
  if (['equipment-breakdown', 'factory-fire', 'plant-asset-damage'].includes(lossType)) return 'industrial';
  return 'motor';
}

const AGENT_DEMO_POLICYHOLDER_NAMES: Record<string, string> = {
  'POL-DEMO-AGENT-001': 'Muhammad Ahmed',
  'POL-DEMO-AGENT-002': 'Ayesha Khan',
  'POL-DEMO-AGENT-003': 'Bilal Raza',
};

function formatPolicyholderName(claim: Claim): string {
  const mapped = AGENT_DEMO_POLICYHOLDER_NAMES[claim.policyNumber];
  if (mapped) return mapped;
  if (claim.createdByUserId && !claim.createdByUserId.includes('handler')) {
    return claim.createdByUserId
      .replaceAll('-', ' ')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return 'On file with insurer';
}

export default function ReportsHistoryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const userId = sessionStorage.getItem('userId') || 'policyholder-demo';
  if (role === 'policyholder') {
    seedDemoPolicyholderOutcomeClaims(userId, 'insurer-demo');
    seedDemoPolicyholderEvidenceReports(userId);
  } else if (role === 'field-agent') {
    seedDemoAssignedClaimsForAgent(userId, 'insurer-demo');
  }
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

  const policyholderListEntries = useMemo(() => {
    const policyholderClaims = store.claims.filter((claim) => claim.createdByUserId === userId);
    const claimMap = new Map(policyholderClaims.map((claim) => [claim.id, claim]));

    const fromReports: PolicyholderListEntry[] = reports
      .filter((report) => !report.submittedByRole || report.submittedByRole === 'policyholder')
      .map((report) => {
        const linkedClaim = report.claimId ? claimMap.get(report.claimId) : null;
        return {
          id: report.id,
          routeId: report.id,
          claimNumber: report.claimNumber || linkedClaim?.claimNumber || `CLAIM-${report.id.slice(-5)}`,
          assetName: report.vehicleName || 'Asset not specified',
          date: report.date,
          claimState: (linkedClaim?.state || report.claimState || null) as ClaimState | null,
        };
      });

    const fromClaimsOnly: PolicyholderListEntry[] = policyholderClaims.map((claim) => ({
      id: `claim-only-${claim.id}`,
      routeId: `claim-only-${claim.id}`,
      claimNumber: claim.claimNumber,
      assetName: `${claim.lossType.replaceAll('-', ' ')} claim`,
      date: claim.updatedAt,
      claimState: claim.state,
    }));

    const canonicalByClaimNumber = new Map<string, PolicyholderListEntry>();
    [...fromReports, ...fromClaimsOnly].forEach((entry) => {
      const existing = canonicalByClaimNumber.get(entry.claimNumber);
      if (!existing || new Date(entry.date).getTime() > new Date(existing.date).getTime()) {
        canonicalByClaimNumber.set(entry.claimNumber, entry);
      }
    });

    return Array.from(canonicalByClaimNumber.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, store.claims, userId]);

  const pendingEntries = useMemo(
    () =>
      policyholderListEntries.filter(
        (entry) => entry.claimState && POLICYHOLDER_PENDING_STATES.includes(entry.claimState)
      ),
    [policyholderListEntries]
  );

  const paidEntries = useMemo(
    () => policyholderListEntries.filter((entry) => entry.claimState === 'PAID'),
    [policyholderListEntries]
  );

  const rejectedEntries = useMemo(
    () => policyholderListEntries.filter((entry) => entry.claimState === 'REJECTED'),
    [policyholderListEntries]
  );
  const infoRequestedEntries = useMemo(
    () => policyholderListEntries.filter((entry) => entry.claimState === 'INFO_REQUESTED'),
    [policyholderListEntries]
  );
  const requestedView = useMemo(() => new URLSearchParams(location.search).get('view'), [location.search]);
  const policyholderFilteredView = useMemo(() => {
    if (requestedView === 'policyholder-pending') {
      return {
        title: 'Active Claims',
        entries: pendingEntries,
        emptyText: 'No pending claims at the moment.',
      };
    }
    if (requestedView === 'policyholder-paid') {
      return {
        title: 'Paid Claims',
        entries: paidEntries,
        emptyText: 'No paid claims yet.',
      };
    }
    if (requestedView === 'policyholder-rejected') {
      return {
        title: 'Rejected Claims',
        entries: rejectedEntries,
        emptyText: 'No rejected claims.',
      };
    }
    if (requestedView === 'policyholder-info-requests') {
      return {
        title: 'Pending Information Requests',
        entries: infoRequestedEntries,
        emptyText: 'No pending information requests at the moment.',
      };
    }
    if (requestedView === 'policyholder-reported') {
      return {
        title: 'Reported Claims',
        entries: policyholderListEntries,
        emptyText: 'No reported claims yet.',
      };
    }
    return null;
  }, [infoRequestedEntries, paidEntries, pendingEntries, policyholderListEntries, rejectedEntries, requestedView]);
  const pageTitle = useMemo(() => {
    if (role === 'field-agent') {
      return requestedView === 'agent-info-requests' ? 'Pending Information Requests' : 'Assigned Claims';
    }
    if (policyholderFilteredView) return policyholderFilteredView.title;
    return 'Claim Center';
  }, [policyholderFilteredView, requestedView, role]);

  const launchAssessment = (claim: Claim, mode: 'agent' | 'agent-context') => {
    sessionStorage.setItem('activeClaimId', claim.id);
    sessionStorage.setItem('claimLine', getClaimLineFromLossType(claim.lossType));
    sessionStorage.setItem('inspectionType', claim.lossType);
    sessionStorage.setItem('assessmentMode', mode);
    navigate('/vehicle-capture');
  };

  if (role === 'field-agent') {
    const agentInfoRequestMode = requestedView === 'agent-info-requests';
    const infoRequestClaims = agentAssignedClaims.filter((claim) => claim.state === 'INFO_REQUESTED');
    const submittedItems = submittedByAgent.map((report) => ({
      report,
      claim:
        (report.claimId ? store.claims.find((item) => item.id === report.claimId) : null) ||
        (report.claimNumber ? store.claims.find((item) => item.claimNumber === report.claimNumber) : null) ||
        null,
    }));

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
            <ArrowLeft size={22} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {pageTitle}
          </Typography>
        </Box>

        <Container sx={{ py: 3, pb: 4 }}>
          {(agentInfoRequestMode ? infoRequestClaims : agentAssignedClaims).length === 0 ? (
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {agentInfoRequestMode ? 'No pending information requests.' : 'No claims are assigned to your field profile yet.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3, mb: 3 }}>
              {(agentInfoRequestMode ? infoRequestClaims : agentAssignedClaims).map((claim) => (
                <Card key={claim.id} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/report/claim-only-${claim.id}`)}>
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
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.2 }}>
                      Policy: {claim.policyNumber} • Policyholder: {formatPolicyholderName(claim)} • Location: {claim.lossLocation?.address || 'Location not available'}
                    </Typography>
                    {claim.state === 'INFO_REQUESTED' ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation();
                          launchAssessment(claim, 'agent-context');
                        }}
                      >
                        Add Requested Context
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation();
                          launchAssessment(claim, 'agent');
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
              {submittedItems.map(({ report, claim }) => (
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
                        {claim && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                            Policy: {claim.policyNumber} • Policyholder: {formatPolicyholderName(claim)} • Location: {claim.lossLocation?.address || 'Location not available'}
                          </Typography>
                        )}
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
          {pageTitle}
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 4 }}>
        {policyholderListEntries.length === 0 ? (
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <FileText size={52} style={{ color: '#94A3B8', marginBottom: 14 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No claims yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start your first claim from the dashboard to begin tracking updates here.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/inspection-type')}>
                Create New Claim
              </Button>
            </CardContent>
          </Card>
        ) : policyholderFilteredView ? (
          <Box>
            {policyholderFilteredView.entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {policyholderFilteredView.emptyText}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {policyholderFilteredView.entries.map((report) => (
                  <Card key={report.id} onClick={() => navigate(`/report/${report.routeId}`)} sx={{ cursor: 'pointer' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ mr: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {report.claimNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {report.assetName}
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
                          label={
                            report.claimState === 'PAID'
                              ? 'Paid'
                              : report.claimState === 'REJECTED'
                                ? 'Rejected'
                                : report.claimState === 'INFO_REQUESTED'
                                  ? 'Info Requested'
                                  : report.claimState
                                    ? CLAIM_STATE_LABELS[report.claimState]
                                    : 'Pending'
                          }
                          color={
                            report.claimState === 'PAID'
                              ? 'success'
                              : report.claimState === 'REJECTED'
                                ? 'error'
                                : report.claimState === 'INFO_REQUESTED'
                                  ? 'warning'
                                  : 'default'
                          }
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Pending / In-Progress Claims
              </Typography>
              {pendingEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No pending claims at the moment.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {pendingEntries.map((report) => (
                    <Card key={report.id} onClick={() => navigate(`/report/${report.routeId}`)} sx={{ cursor: 'pointer' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ mr: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {report.claimNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.assetName}
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
                          <Chip size="small" icon={<ShieldCheck size={14} />} label={report.claimState ? CLAIM_STATE_LABELS[report.claimState] : 'Pending'} />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Paid Claims
              </Typography>
              {paidEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No paid claims yet.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {paidEntries.map((report) => (
                    <Card key={report.id} onClick={() => navigate(`/report/${report.routeId}`)} sx={{ cursor: 'pointer' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ mr: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {report.claimNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.assetName}
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
                          <Chip size="small" icon={<ShieldCheck size={14} />} label="Paid" color="success" />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Rejected Claims
              </Typography>
              {rejectedEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No rejected claims.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {rejectedEntries.map((report) => (
                    <Card key={report.id} onClick={() => navigate(`/report/${report.routeId}`)} sx={{ cursor: 'pointer' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ mr: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {report.claimNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.assetName}
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
                          <Chip size="small" icon={<ShieldCheck size={14} />} label="Rejected" color="error" />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Container>

      <BottomNavigation />
    </Box>
  );
}
