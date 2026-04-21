import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Container, FormControlLabel, IconButton, Snackbar, Typography } from '@mui/material';
import { ArrowLeft, CheckSquare, FileDown, Send, Share2 } from 'lucide-react';
import OfflineIndicator from './OfflineIndicator';
import { clearCurrentDraft } from '../utils/offlineStorage';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import { canTransition, CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { getClaimById, transitionClaimState } from '../domain/claims/service';

export default function InspectionReportScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const userId = sessionStorage.getItem('userId') || 'policyholder-demo';
  const assessmentMode = sessionStorage.getItem('assessmentMode') || 'standard';
  const [observations, setObservations] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; severity: 'info' | 'success' | 'error' }>({
    message: '',
    severity: 'info',
  });

  const claimId = sessionStorage.getItem('activeClaimId');
  const claim = claimId ? getClaimById(claimId) : null;
  const claimLine = sessionStorage.getItem('claimLine') || 'motor';
  const vehicleName = sessionStorage.getItem('selectedVehicleName') || 'Unverified vehicle';
  const claimType = sessionStorage.getItem('inspectionType') || 'collision';
  const claimDate = useMemo(() => new Date(), []);

  useEffect(() => {
    const data = JSON.parse(sessionStorage.getItem('inspectionData') || '{"observations":[]}');
    const rows = data.observations || [];
    setObservations(rows);
    setSelected(new Set(rows.map((item: any) => item.id)));
  }, []);

  const toggleObservation = (observationId: string) => {
    const next = new Set(selected);
    if (next.has(observationId)) next.delete(observationId);
    else next.add(observationId);
    setSelected(next);
  };

  const advance = (toState: Parameters<typeof transitionClaimState>[1], eventType: string, payload: Record<string, unknown> = {}) => {
    if (!claimId) return;
    const latest = getClaimById(claimId);
    if (!latest) return;
    if (latest.state === toState || canTransition(latest.state, toState)) {
      transitionClaimState(claimId, toState, sessionStorage.getItem('userId') || 'policyholder-demo', eventType, payload);
    }
  };

  const persistReport = (mode: 'submitted' | 'saved') => {
    const updatedClaim = claimId ? getClaimById(claimId) : null;
    const selectedRows = observations.filter((item) => selected.has(item.id));
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    savedReports.push({
      id: Date.now().toString(),
      claimId,
      claimNumber: updatedClaim?.claimNumber || null,
      claimState: updatedClaim?.state || null,
      vehicleName,
      claimLine,
      inspectionType: claimType,
      date: claimDate.toISOString(),
      submittedByUserId: userId,
      submittedByRole: role,
      submissionMode: assessmentMode,
      observations,
      observationsCount: observations.length,
      selectedObservationsForPlatform: Array.from(selected),
      submittedObservationsIds: mode === 'submitted' ? selectedRows.map((item: any) => item.id) : [],
      vehicleData: JSON.parse(sessionStorage.getItem('confirmedVehicleData') || '{}'),
    });
    localStorage.setItem('savedReports', JSON.stringify(savedReports));

    if (mode === 'submitted') {
      sessionStorage.setItem('platformSelectedObservations', JSON.stringify(selectedRows));
    }
    sessionStorage.setItem('successType', mode);
    sessionStorage.setItem('savedObservationsCount', String(observations.length));
  };

  const handleSaveOnly = () => {
    advance('INVESTIGATION_IN_PROGRESS', 'INVESTIGATION_STARTED');
    advance('ESTIMATE_PENDING', 'ESTIMATE_PENDING');
    persistReport('saved');
    clearCurrentDraft();
    navigate('/submission-confirmation');
  };

  const handleSubmitClaim = () => {
    if (!selected.size) {
      setFeedback({ message: 'Select at least one finding to submit.', severity: 'info' });
      return;
    }

    if (role === 'field-agent') {
      const latest = claimId ? getClaimById(claimId) : null;
      if (latest?.state === 'INFO_REQUESTED' || assessmentMode === 'agent-context') {
        advance('INFO_RECEIVED', 'AGENT_CONTEXT_RECEIVED');
      }
      advance('INVESTIGATION_IN_PROGRESS', 'AGENT_ASSESSMENT_STARTED');
      advance('ESTIMATE_PENDING', 'ASSESSMENT_PENDING');
      advance('ESTIMATE_SUBMITTED', 'AGENT_ASSESSMENT_SUBMITTED', { submittedBy: userId, mode: assessmentMode });
    } else {
      advance('INVESTIGATION_IN_PROGRESS', 'INVESTIGATION_STARTED');
      advance('ESTIMATE_PENDING', 'ESTIMATE_PENDING');
      advance('ESTIMATE_SUBMITTED', 'ESTIMATE_SUBMITTED');
      advance('APPROVAL_PENDING', 'APPROVAL_PENDING');
    }
    persistReport('submitted');

    sessionStorage.removeItem('inspectionData');
    clearCurrentDraft();
    navigate('/submission-confirmation');
  };

  const handleExport = async () => {
    try {
      await generateInspectionPDF(
        vehicleName,
        claimType,
        claimDate,
        observations,
        JSON.parse(sessionStorage.getItem('confirmedVehicleData') || '{}')
      );
      setFeedback({ message: 'Claim PDF exported.', severity: 'success' });
    } catch {
      setFeedback({ message: 'Unable to export PDF right now.', severity: 'error' });
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      setFeedback({ message: 'Sharing is not available on this device.', severity: 'info' });
      return;
    }
    try {
      await navigator.share({
        title: 'Insurance claim summary',
        text: `${vehicleName} claim summary with ${selected.size} selected findings.`,
      });
    } catch {
      setFeedback({ message: 'Share action cancelled.', severity: 'info' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <OfflineIndicator />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
          <ArrowLeft size={22} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {role === 'field-agent' ? 'Field Assessment Summary' : 'Claim Submission Summary'}
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 6 }}>
        <Card sx={{ mb: 2.5, borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Claim
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {claim?.claimNumber || 'Pending claim number'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Asset: {vehicleName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Line: {claimLine} • Type: {claimType}
            </Typography>
            <Chip label={claim ? CLAIM_STATE_LABELS[claim.state] : 'Draft'} size="small" />
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mb: 2.5 }}>
          {role === 'field-agent'
            ? 'Select findings to send to the existing claim in ERP. You can save a draft and continue later.'
            : 'Select findings to submit now. You can save a draft and continue later.'}
        </Alert>

        <Card sx={{ mb: 2.5, borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <CheckSquare size={18} style={{ marginRight: 8 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Claim Findings ({observations.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {observations.map((item: any) => (
                <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.title || `${item.category || 'Damage'} finding`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {item.description || 'No details provided'}
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox checked={selected.has(item.id)} onChange={() => toggleObservation(item.id)} />}
                      label="Submit with this claim"
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button variant="contained" size="large" onClick={handleSubmitClaim} startIcon={<Send size={18} />} sx={{ py: 1.4 }}>
            {role === 'field-agent' ? `Submit Assessment (${selected.size})` : `Submit Claim (${selected.size})`}
          </Button>
          <Button variant="outlined" size="large" onClick={handleSaveOnly} sx={{ py: 1.3 }}>
            Save as Draft
          </Button>
          <Button variant="outlined" size="large" onClick={handleExport} startIcon={<FileDown size={18} />} sx={{ py: 1.3 }}>
            Export Claim PDF
          </Button>
          <Button variant="outlined" size="large" onClick={handleShare} startIcon={<Share2 size={18} />} sx={{ py: 1.3 }}>
            Share Claim Summary
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={Boolean(feedback.message)}
        autoHideDuration={3000}
        onClose={() => setFeedback((current) => ({ ...current, message: '' }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={feedback.severity} onClose={() => setFeedback((current) => ({ ...current, message: '' }))}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
