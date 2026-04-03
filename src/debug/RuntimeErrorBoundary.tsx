import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { Component } from 'react';
import { fromReactErrorBoundary, type CapturedRuntimeError } from './runtimeErrorMonitor';

interface RuntimeErrorBoundaryProps extends PropsWithChildren {
  onError: (error: CapturedRuntimeError) => void;
}

interface RuntimeErrorBoundaryState {
  hasError: boolean;
}

export class RuntimeErrorBoundary extends Component<RuntimeErrorBoundaryProps, RuntimeErrorBoundaryState> {
  state: RuntimeErrorBoundaryState = {
    hasError: false,
  };

  componentDidCatch(error: Error) {
    this.props.onError(fromReactErrorBoundary(error));
    this.setState({ hasError: true });
  }

  private readonly resetBoundary = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box p={2}>
          <Stack spacing={2}>
            <Alert severity="error">The app hit an unrecoverable error.</Alert>
            <Typography>
              A debug popup with the message and stack trace should now be visible. Dismiss and retry.
            </Typography>
            <Button variant="contained" onClick={this.resetBoundary}>
              Retry render
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}
