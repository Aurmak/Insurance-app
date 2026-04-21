import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, Container, Typography } from '@mui/material';
import { CheckCircle2, Clock3, Home, ListChecks } from 'lucide-react';
import { CLAIM_STATE_LABELS } from '../domain/claims/stateMachine';
import { getClaimById } from '../domain/claims/service';

export default function SubmissionConfirmationScreen() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const [claimNumber, setClaimNumber] = useState<string | null>(null);
  const [claimStateLabel, setClaimStateLabel] = useState('Submitted');
  const [mode, setMode] = useState<'saved' | 'submitted'>('submitted');

  useEffect(() => {
    const successType = (sessionStorage.getItem('successType') || 'submitted') as 'saved' | 'submitted';
    setMode(successType);
    const claimId = sessionStorage.getItem('activeClaimId');
    if (claimId) {
      const claim = getClaimById(claimId);
      if (claim) {
        setClaimNumber(claim.claimNumber);
        setClaimStateLabel(CLAIM_STATE_LABELS[claim.state]);
      }
    }
  }, []);

  return (
    <div className="mobile-container">
      <Container sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
        <Box sx={{ width: '100%' }}>
          <Card sx={{ borderRadius: 4, mb: 2.5 }}>
            <CardContent sx={{ p: 3.5, textAlign: 'center' }}>
              <CheckCircle2 size={56} color="#16A34A" style={{ marginBottom: 12 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {mode === 'saved'
                  ? role === 'field-agent' ? 'Assessment Draft Saved' : 'Claim Draft Saved'
                  : role === 'field-agent' ? 'Assessment Submitted' : 'Claim Submitted'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mode === 'saved'
                  ? 'Your claim draft is saved and ready for final submission.'
                  : role === 'field-agent'
                    ? 'Your field assessment has been submitted to the linked insurer claim.'
                    : 'Your claim has been submitted and routed for insurer processing.'}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Claim Number
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {claimNumber || 'Pending'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock3 size={15} color="#64748B" />
                <Typography variant="body2" color="text.secondary">
                  Current status: {claimStateLabel}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                What happens next
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {role === 'field-agent'
                  ? 'Back-office claim handler will review this assessment in ERP and continue the lifecycle.'
                  : 'Agent assignment, estimate review, approval decision, settlement calculation, and payment tracking all continue from this claim record.'}
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3 }}>
            <Button variant="contained" startIcon={<Home size={18} />} onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="outlined" startIcon={<ListChecks size={18} />} onClick={() => navigate('/reports-history')}>
              Open Claims Workspace
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
