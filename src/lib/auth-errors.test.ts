import {
  getAuthResultErrorMessage,
  getAuthThrownErrorMessage,
  getAuthUnexpectedResultMessage
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

  it('uses statusText when error message is missing', () => {
    expect(getAuthResultErrorMessage({ error: { statusText: 'Unauthorized' } }, 'fallback')).toBe(
      'Unauthorized'
    );
  });

  it('extracts thrown Error message', () => {
    expect(getAuthThrownErrorMessage(new Error('Network timeout'), 'fallback')).toBe('Network timeout');
  });

  it('returns fallback for unknown thrown values', () => {
    expect(getAuthThrownErrorMessage({ reason: 'bad' }, 'Unable to register')).toBe('Unable to register');
  });

  it('detects unexpected HTML auth response payloads', () => {
    expect(getAuthUnexpectedResultMessage({ data: '<!doctype html><html><body>redirect</body></html>' })).toBe(
      'Auth endpoint returned HTML instead of API data. Check BETTER_AUTH_URL and current app origin.'
    );
  });

  it('ignores expected non-HTML result payloads', () => {
    expect(getAuthUnexpectedResultMessage({ data: { token: 'abc' }, error: null })).toBeNull();
  });
});
