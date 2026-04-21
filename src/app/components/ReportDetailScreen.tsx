import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Card, CardContent, Chip, Container, IconButton, Typography } from '@mui/material';
import { ArrowLeft, FileDown, Send, Share2 } from 'lucide-react';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { getClaimById, getClaimTimeline } from '../domain/claims/service';
import { generateInspectionPDF } from '../utils/pdfGenerator';

export default function ReportDetailScreen() {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const reports = JSON.parse(localStorage.getItem('savedReports') || '[]');
  const report = reports.find((item: any) => item.id === reportId);

  const claim = useMemo(() => {
    if (!report?.claimId) return null;
    return getClaimById(report.claimId);
  }, [report?.claimId]);

  const timeline = useMemo(() => {
    if (!report?.claimId) return [];
    return getClaimTimeline(report.claimId).sort((a, b) => b.eventAt.localeCompare(a.eventAt));
  }, [report?.claimId]);

  if (!report) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1">Claim record not found.</Typography>
      </Box>
    );
  }

  const observations = report.observations || [];

  const handleExport = async () => {
    await generateInspectionPDF(
      report.vehicleName || 'Unknown Vehicle',
      report.inspectionType || 'collision',
      new Date(report.date),
      observations,
      report.vehicleData
    );
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    await navigator.share({
      title: report.claimNumber || 'Claim Summary',
      text: `Claim ${report.claimNumber || report.id} status: ${claim ? CLAIM_STATE_LABELS[claim.state] : 'Saved'}`,
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => navigate('/reports-history')} sx={{ mr: 1 }}>
          <ArrowLeft size={22} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Claim Detail
        </Typography>
      </Box>

      <Container sx={{ py: 3, pb: 5 }}>
        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Claim Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {report.claimNumber || `CLAIM-${report.id.slice(-5)}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Asset: {report.vehicleName || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Created: {new Date(report.date).toLocaleString()}
            </Typography>
            <Chip label={claim ? CLAIM_STATE_LABELS[claim.state] : 'Saved'} color={claim?.state === 'REJECTED' ? 'error' : 'default'} />
          </CardContent>
        </Card>

        {report.vehicleData?.pakistanVerification && (
          <Card sx={{ borderRadius: 3, mb: 2.5, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Customs / Excise Verification Snapshot
              </Typography>
              <Typography variant="body2">Registration: {report.vehicleData.pakistanVerification.registrationNo}</Typography>
              <Typography variant="body2">Make/Model: {report.vehicleData.pakistanVerification.make} {report.vehicleData.pakistanVerification.vehicleModel}</Typography>
              <Typography variant="body2">Owner: {report.vehicleData.pakistanVerification.ownerName}</Typography>
            </CardContent>
          </Card>
        )}

        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Claim Timeline
            </Typography>
            {timeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No timeline events recorded yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {timeline.slice(0, 8).map((event) => (
                  <Card key={event.id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.eventType.replaceAll('_', ' ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.eventAt).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, mb: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Claim Handler Controls
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lifecycle actions such as approve/reject, request info, settlement amount, payment, and closure are managed in back-office ERP by the claim handler.
            </Typography>
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mb: 2 }}>
          Findings captured: {observations.length}. Submitted findings: {(report.submittedObservationsIds || []).length}.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3 }}>
          {role === 'field-agent' && (
            <Button
              variant="contained"
              startIcon={<Send size={18} />}
              onClick={() => {
                if (report.claimId) sessionStorage.setItem('activeClaimId', report.claimId);
                sessionStorage.setItem('assessmentMode', claim?.state === 'INFO_REQUESTED' ? 'agent-context' : 'agent');
                navigate('/vehicle-capture');
              }}
            >
              {claim?.state === 'INFO_REQUESTED' ? 'Add Requested Context' : 'Add Field Assessment'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<FileDown size={18} />} onClick={handleExport}>
            Export Claim PDF
          </Button>
          <Button variant="outlined" startIcon={<Share2 size={18} />} onClick={handleShare}>
            Share Claim Status
          </Button>
          {role !== 'field-agent' && (
            <Button variant="contained" startIcon={<Send size={18} />} onClick={() => navigate('/inspection-type')}>
              Create New Claim
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
}
