import { useEffect, useState } from 'react';
import { Box, Chip, Snackbar, Alert } from '@mui/material';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Check if we're in offline test mode
    const selectedProperty = sessionStorage.getItem('selectedProperty');
    if (selectedProperty === 'offline-test') {
      setIsOnline(false);
      return;
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <>
      {!isOnline && (
        <Chip
          icon={<WifiOff size={14} />}
          label="Offline"
          size="small"
          sx={{
            bgcolor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            height: 28,
            fontSize: '0.75rem',
            fontWeight: 500,
            '& .MuiChip-icon': {
              color: '#856404'
            }
          }}
        />
      )}
      
      {/* Toast notification when back online */}
      <Snackbar
        open={showReconnected}
        autoHideDuration={3000}
        onClose={() => setShowReconnected(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: 16 }}
      >
        <Alert 
          severity="success" 
          icon={<Wifi size={18} />}
          sx={{ width: '100%' }}
          onClose={() => setShowReconnected(false)}
        >
          <strong>Back Online</strong> - You can now submit reports to Platform.
        </Alert>
      </Snackbar>
    </>
  );
}

// Hook to check online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if we're in offline test mode
    const selectedProperty = sessionStorage.getItem('selectedProperty');
    if (selectedProperty === 'offline-test') {
      setIsOnline(false);
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}