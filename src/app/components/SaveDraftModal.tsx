import { Drawer, Button, Typography, Box } from '@mui/material';
import { CheckCircle } from 'lucide-react';

interface SaveDraftModalProps {
  show: boolean;
  onStartNewWalkthrough: () => void;
  onViewDrafts: () => void;
}

export default function SaveDraftModal({ show, onStartNewWalkthrough, onViewDrafts }: SaveDraftModalProps) {
  return (
    <Drawer 
      anchor="bottom"
      open={show}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '85vh'
        }
      }}
    >
      <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CheckCircle size={64} style={{ color: '#28a745' }} />
        </Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Draft Saved Successfully
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Your inspection progress has been saved locally. You can view your drafts or start a new walkthrough.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button 
            onClick={onViewDrafts}
            variant="contained"
            fullWidth
            size="large"
            sx={{ 
              py: 1.5,
              fontWeight: 500
            }}
          >
            View saved draft
          </Button>
          <Button 
            variant="outlined"
            onClick={onStartNewWalkthrough}
            fullWidth
            size="large"
            sx={{ 
              py: 1.5,
              fontWeight: 500
            }}
          >
            Start a new walkthrough
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
