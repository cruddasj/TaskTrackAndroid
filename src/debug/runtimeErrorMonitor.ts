import { useEffect } from 'react';

export type RuntimeErrorSource = 'window.error' | 'window.unhandledrejection' | 'react.error-boundary';

export interface CapturedRuntimeError {
  source: RuntimeErrorSource;
  message: string;
  stack: string;
  timestamp: string;
}

const fallbackMessage = 'Unknown runtime error';

const normalizeUnknownError = (value: unknown): { message: string; stack: string } => {
  if (value instanceof Error) {
    return {
      message: value.message || fallbackMessage,
      stack: value.stack ?? 'No stack trace available.',
    };
  }

  if (typeof value === 'string') {
    return {
      message: value,
      stack: 'No stack trace available.',
    };
  }

  if (value === null || value === undefined) {
    return {
      message: fallbackMessage,
      stack: 'No stack trace available.',
    };
  }

  try {
    return {
      message: JSON.stringify(value),
      stack: 'No stack trace available.',
    };
  } catch {
    return {
      message: String(value),
      stack: 'No stack trace available.',
    };
  }
};

const createCapturedError = (source: RuntimeErrorSource, errorLike: unknown): CapturedRuntimeError => {
  const normalized = normalizeUnknownError(errorLike);
  return {
    source,
    message: normalized.message,
    stack: normalized.stack,
    timestamp: new Date().toISOString(),
  };
};

export const fromWindowErrorEvent = (event: ErrorEvent): CapturedRuntimeError => {
  const errorLike = event.error ?? event.message;
  return createCapturedError('window.error', errorLike);
};

export const fromUnhandledRejection = (event: PromiseRejectionEvent): CapturedRuntimeError =>
  createCapturedError('window.unhandledrejection', event.reason);

export const fromReactErrorBoundary = (error: Error): CapturedRuntimeError =>
  createCapturedError('react.error-boundary', error);

export const useRuntimeErrorMonitor = (onError: (error: CapturedRuntimeError) => void) => {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      onError(fromWindowErrorEvent(event));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      onError(fromUnhandledRejection(event));
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);
};
