import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import type { CapturedRuntimeError } from './runtimeErrorMonitor';

interface RuntimeErrorDialogProps {
  error: CapturedRuntimeError | null;
  onClose: () => void;
}

export const RuntimeErrorDialog = ({ error, onClose }: RuntimeErrorDialogProps) => (
  <Dialog open={Boolean(error)} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Debug: fatal runtime error captured</DialogTitle>
    <DialogContent dividers>
      {error && (
        <Stack spacing={2}>
          <Typography>
            <strong>Source:</strong> {error.source}
          </Typography>
          <Typography>
            <strong>Timestamp:</strong> {error.timestamp}
          </Typography>
          <Typography>
            <strong>Message:</strong> {error.message}
          </Typography>
          <Typography component="pre" sx={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.stack}
          </Typography>
        </Stack>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);
