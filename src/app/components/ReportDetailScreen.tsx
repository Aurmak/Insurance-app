import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Card, CardContent, Chip, Container, IconButton, TextField, Typography } from '@mui/material';
import { ArrowLeft, FileDown, Send } from 'lucide-react';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { getClaimById, getClaimTimeline, seedDemoPolicyholderEvidenceReports, submitClaimAppeal } from '../domain/claims/service';
import { generateInspectionPDF } from '../utils/pdfGenerator';

function formatTimelineEventLabel(eventType: string) {
  const normalized = eventType.replaceAll('_', ' ').toLowerCase();
  const aliases: Record<string, string> = {
    'fnol submitted': 'Claim reported',
    'vehicle verified': 'Asset verification completed',
    'erp created': 'Insurer case created',
    assigned: 'Assigned for review',
    'info requested': 'More information requested',
    'info received': 'Additional information received',
    'assessment submitted by policyholder': 'You submitted additional context',
    'assessment submitted by agent': 'Field assessment submitted',
    paid: 'Payment completed',
    rejected: 'Claim rejected',
    closed: 'Claim closed',
  };
  return aliases[normalized] || normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRelativeTime(isoDate: string): string {
  const deltaMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getTimelineEventTone(eventType: string): {
  chipColor: 'default' | 'error' | 'warning' | 'success' | 'info';
  accentColor: string;
  rowTint: string;
} {
  const normalized = eventType.toUpperCase();
  if (normalized.includes('REJECTED')) {
    return { chipColor: 'error', accentColor: '#B91C1C', rowTint: '#FEF2F2' };
  }
  if (normalized.includes('PAID') || normalized.includes('APPROVED') || normalized.includes('CLOSED')) {
    return { chipColor: 'success', accentColor: '#047857', rowTint: '#ECFDF5' };
  }
  if (normalized.includes('INFO_REQUESTED')) {
    return { chipColor: 'warning', accentColor: '#B45309', rowTint: '#FFFBEB' };
  }
  if (normalized.includes('INFO_RECEIVED')) {
    return { chipColor: 'info', accentColor: '#8B0037', rowTint: '#F7EAF0' };
  }
  return { chipColor: 'default', accentColor: '#334155', rowTint: '#F8FAFC' };
}

export default function ReportDetailScreen() {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const userId = sessionStorage.getItem('userId') || 'policyholder-demo';
  if (role === 'policyholder') {
    seedDemoPolicyholderEvidenceReports(userId);
  }
  const reports = JSON.parse(localStorage.getItem('savedReports') || '[]');
  const claimOnlyId = reportId?.startsWith('claim-only-') ? reportId.replace('claim-only-', '') : null;
  const claimOnly = claimOnlyId ? getClaimById(claimOnlyId) : null;
  const report = reports.find((item: any) => item.id === reportId);
  const [appealText, setAppealText] = useState('');
  const [appealFeedback, setAppealFeedback] = useState('');

  const effectiveClaimId = report?.claimId || claimOnly?.id || null;

  const claim = useMemo(() => {
    if (!effectiveClaimId) return null;
    return getClaimById(effectiveClaimId);
  }, [effectiveClaimId]);

  const timeline = useMemo(() => {
    if (!effectiveClaimId) return [];
    return getClaimTimeline(effectiveClaimId).sort((a, b) => b.eventAt.localeCompare(a.eventAt));
  }, [effectiveClaimId]);

  if (!report && !claimOnly) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1">Claim record not found.</Typography>
      </Box>
    );
  }

  const paidEvent = claim ? timeline.find((event) => event.eventType === 'PAID') : null;
  const rejectedEvent = claim ? timeline.find((event) => event.eventType === 'REJECTED') : null;
  const appealEvent = claim ? timeline.find((event) => event.eventType === 'APPEAL_SUBMITTED') : null;
  const amountPaid = paidEvent?.payload?.amountPaidPKR as number | undefined;
  const rejectionReason =
    (rejectedEvent?.payload?.reason as string | undefined) ||
    (claim?.reasonText as string | undefined) ||
    null;

  const displayClaimNumber = report?.claimNumber || claimOnly?.claimNumber || `CLAIM-${(reportId || '').slice(-5)}`;
  const displayAsset = report?.vehicleName || (claimOnly ? `${claimOnly.lossType.replaceAll('-', ' ')} claim` : 'N/A');
  const displayDate = report?.date || claimOnly?.updatedAt || new Date().toISOString();
  const linkedReports = useMemo(
    () =>
      reports.filter(
        (item: any) =>
          (effectiveClaimId && item?.claimId === effectiveClaimId) ||
          (item?.claimNumber && item.claimNumber === displayClaimNumber)
      ),
    [displayClaimNumber, effectiveClaimId, reports]
  );
  const evidenceItemCount = useMemo(() => {
    const ids = new Set<string>();
    linkedReports.forEach((item: any) => {
      (item?.observations || []).forEach((observation: any, index: number) => {
        ids.add(String(observation?.id || `${item.id}_obs_${index}`));
      });
    });
    return ids.size;
  }, [linkedReports]);
  const submittedItemCount = useMemo(() => {
    const ids = new Set<string>();
    linkedReports.forEach((item: any) => {
      (item?.submittedObservationsIds || []).forEach((observationId: string) => ids.add(String(observationId)));
    });
    return ids.size;
  }, [linkedReports]);
  const observations = report?.observations || linkedReports[0]?.observations || [];

  const handleExport = async () => {
    if (!report && !claim) return;
    await generateInspectionPDF(
      report?.vehicleName || displayAsset || 'Unknown Asset',
      report?.inspectionType || claim?.lossType || 'collision',
      new Date(report?.date || displayDate),
      observations,
      report?.vehicleData || {}
    );
  };

  const handleAppealSubmit = () => {
    if (!claim) return;
    if (!appealText.trim()) {
      setAppealFeedback('Please add appeal details before submitting.');
      return;
    }
    submitClaimAppeal(claim.id, userId, appealText.trim());
    setAppealText('');
    setAppealFeedback('Appeal submitted. Your claim handler will review and respond.');
    navigate(0);
  };

  const handleProvideRequestedInfo = (mode: 'policyholder-context' | 'agent-context' = 'policyholder-context') => {
    if (!claim) return;
    sessionStorage.setItem('activeClaimId', claim.id);
    sessionStorage.setItem(
      'claimLine',
      claim.lossType === 'collision' || claim.lossType === 'third-party' || claim.lossType === 'theft' ? 'motor' : 'property'
    );
    sessionStorage.setItem('inspectionType', claim.lossType);
    sessionStorage.setItem('assessmentMode', mode);
    navigate('/vehicle-capture');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => navigate('/reports-history')} sx={{ mr: 1 }}>
          <ArrowLeft size={22} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Claim Details
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 5 }}>
        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Claim Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {displayClaimNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Asset: {displayAsset}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Updated: {new Date(displayDate).toLocaleString()}
            </Typography>
            <Chip label={claim ? CLAIM_STATE_LABELS[claim.state] : 'Saved'} color={claim?.state === 'REJECTED' ? 'error' : 'default'} />
          </CardContent>
        </Card>

        {(claim?.state === 'PAID' || claim?.state === 'REJECTED') && (
          <Card sx={{ borderRadius: 3, mb: 2.5, border: claim.state === 'PAID' ? '1px solid #86EFAC' : '1px solid #FCA5A5' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.2 }}>
                Outcome Summary
              </Typography>
              {claim.state === 'PAID' && (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Amount paid: PKR {Number(amountPaid || 0).toLocaleString()}
                </Typography>
              )}
              {claim.state === 'REJECTED' && (
                <Typography variant="body2" color="text.secondary">
                  Reason for rejection: {rejectionReason || 'The claim did not meet approval criteria.'}
                </Typography>
              )}
              {claim.state === 'PAID' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Payment status: Sent to your registered payout method.
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {report?.vehicleData?.pakistanVerification && (
          <Card sx={{ borderRadius: 3, mb: 2.5, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Customs / Excise Verification Snapshot
              </Typography>
              <Typography variant="body2">Registration: {report?.vehicleData?.pakistanVerification.registrationNo}</Typography>
              <Typography variant="body2">Make/Model: {report?.vehicleData?.pakistanVerification.make} {report?.vehicleData?.pakistanVerification.vehicleModel}</Typography>
              <Typography variant="body2">Owner: {report?.vehicleData?.pakistanVerification.ownerName}</Typography>
            </CardContent>
          </Card>
        )}

        <Card sx={{ borderRadius: 2, mb: 2.5, border: '1px solid #E2E8F0' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Timeline
            </Typography>
            {timeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No timeline updates recorded yet.
              </Typography>
            ) : (
              <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', bgcolor: '#FFFFFF' }}>
                {timeline.slice(0, 12).map((event, index) => {
                  const tone = getTimelineEventTone(event.eventType);
                  const showAgentAssessmentInTimeline =
                    role === 'field-agent' && claim?.state !== 'INFO_REQUESTED' && index === 0;
                  return (
                    <Box
                      key={event.id}
                      sx={{
                        px: 1.4,
                        py: 1.15,
                        borderLeft: `3px solid ${tone.accentColor}`,
                        bgcolor: tone.rowTint,
                        borderBottom: index === Math.min(timeline.length, 12) - 1 ? 'none' : '1px solid #E2E8F0',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatTimelineEventLabel(event.eventType)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {new Date(event.eventAt).toLocaleString()} • {formatRelativeTime(event.eventAt)}
                        </Typography>
                      </Box>
                        {(event.payload?.amountPaidPKR || event.payload?.reason || event.payload?.appealText) && (
                          <Box sx={{ mt: 0.8 }}>
                            {event.payload?.amountPaidPKR && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'success.main' }}>
                                Paid PKR {Number(event.payload.amountPaidPKR).toLocaleString()}
                              </Typography>
                            )}
                          {(event.payload?.reason || event.payload?.reasonText) && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                              {String(event.payload.reasonText || event.payload.reason)}
                            </Typography>
                          )}
                          {event.payload?.appealText && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'info.main' }}>
                              Appeal submitted
                            </Typography>
                          )}
                        </Box>
                      )}
                      {event.eventType === 'INFO_REQUESTED' && (
                        <Box sx={{ mt: 0.8 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                            Required by handler: {String(event.payload?.reasonText || event.payload?.reason || 'Please provide additional photos and supporting details.')}
                          </Typography>
                          {claim?.state === 'INFO_REQUESTED' && role === 'policyholder' && (
                            <Button size="small" variant="contained" onClick={handleProvideRequestedInfo}>
                              Provide Requested Information
                            </Button>
                          )}
                          {claim?.state === 'INFO_REQUESTED' && role === 'field-agent' && (
                            <Button size="small" variant="contained" onClick={() => handleProvideRequestedInfo('agent-context')}>
                              Add Requested Context
                            </Button>
                          )}
                        </Box>
                      )}
                      {showAgentAssessmentInTimeline && (
                        <Box sx={{ mt: 0.8 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Send size={16} />}
                            onClick={() => {
                              if (effectiveClaimId) sessionStorage.setItem('activeClaimId', effectiveClaimId);
                              if (claim) {
                                sessionStorage.setItem(
                                  'claimLine',
                                  claim.lossType === 'collision' || claim.lossType === 'third-party' || claim.lossType === 'theft' ? 'motor' : 'property'
                                );
                                sessionStorage.setItem('inspectionType', claim.lossType);
                              }
                              sessionStorage.setItem('assessmentMode', 'agent');
                              navigate('/vehicle-capture');
                            }}
                          >
                            Add Field Assessment
                          </Button>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {role === 'policyholder' && claim?.state === 'REJECTED' && (
          <Card sx={{ borderRadius: 3, mb: 2.5, border: '1px solid #FDE68A', bgcolor: '#FFFBEB' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Appeal This Decision
              </Typography>
              {appealEvent ? (
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Appeal already submitted on {new Date(appealEvent.eventAt).toLocaleString()}.
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.3 }}>
                    If you believe this decision should be reviewed, submit an appeal with supporting details.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Write your appeal details and supporting context..."
                    value={appealText}
                    onChange={(event) => setAppealText(event.target.value)}
                    sx={{ mb: 1.3 }}
                  />
                  <Button variant="contained" onClick={handleAppealSubmit}>
                    Submit Appeal
                  </Button>
                </>
              )}
              {appealFeedback && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
                  {appealFeedback}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Card sx={{ borderRadius: 3, mb: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              How Claim Decisions Are Managed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approval, rejection, payment amount, and final settlement decisions are managed by the insurer in their back-office claim system.
            </Typography>
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mb: 2 }}>
          Evidence items in this claim: {evidenceItemCount}. Submitted items: {submittedItemCount}.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3 }}>
          <Button variant="outlined" startIcon={<FileDown size={18} />} onClick={handleExport} disabled={!report && !claim}>
            Export Claim Summary (PDF)
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
