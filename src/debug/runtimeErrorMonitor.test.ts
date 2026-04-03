import { fromReactErrorBoundary, fromUnhandledRejection, fromWindowErrorEvent } from './runtimeErrorMonitor';

describe('runtimeErrorMonitor', () => {
  it('captures message and stack from window error event', () => {
    const error = new Error('Boom');
    const event = new ErrorEvent('error', { error, message: 'ignored message' });

    const captured = fromWindowErrorEvent(event);

    expect(captured.source).toBe('window.error');
    expect(captured.message).toBe('Boom');
    expect(captured.stack).toContain('Boom');
    expect(captured.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('falls back to unknown message when rejection reason is missing', () => {
    const event = { reason: null } as PromiseRejectionEvent;

    const captured = fromUnhandledRejection(event);

    expect(captured.source).toBe('window.unhandledrejection');
    expect(captured.message).toBe('Unknown runtime error');
    expect(captured.stack).toBe('No stack trace available.');
  });

  it('captures react error boundary errors', () => {
    const error = new Error('React render failure');

    const captured = fromReactErrorBoundary(error);

    expect(captured.source).toBe('react.error-boundary');
    expect(captured.message).toBe('React render failure');
    expect(captured.stack).toContain('React render failure');
  });
});
