import {
  getAuthResultErrorMessage,
  getAuthThrownErrorMessage
} from './auth-errors';

describe('auth error helpers', () => {
  it('returns null when auth result has no error', () => {
    expect(getAuthResultErrorMessage({ data: { ok: true } }, 'fallback')).toBeNull();
    expect(getAuthResultErrorMessage(undefined, 'fallback')).toBeNull();
  });

  it('returns API error message from auth result', () => {
    expect(getAuthResultErrorMessage({ error: { message: 'Invalid credentials' } }, 'fallback')).toBe(
      'Invalid credentials'
    );
  });

  it('returns fallback when auth result error message is missing', () => {
    expect(getAuthResultErrorMessage({ error: {} }, 'Unable to sign in')).toBe('Unable to sign in');
  });

  it('extracts thrown Error message', () => {
    expect(getAuthThrownErrorMessage(new Error('Network timeout'), 'fallback')).toBe('Network timeout');
  });

  it('returns fallback for unknown thrown values', () => {
    expect(getAuthThrownErrorMessage({ reason: 'bad' }, 'Unable to register')).toBe('Unable to register');
  });
});
