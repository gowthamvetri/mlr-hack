import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  setCredentials,
  updateUserInfo,
  logout,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthToken,
} from '../../store/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  };

  beforeEach(() => {
    // Clear localStorage mock
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  describe('reducers', () => {
    it('should return the initial state', () => {
      const result = authReducer(undefined, { type: 'unknown' });
      expect(result.isAuthenticated).toBe(false);
      expect(result.isLoading).toBe(false);
    });

    it('should handle setCredentials', () => {
      const user = { _id: '123', name: 'Test User', email: 'test@example.com', token: 'abc123' };
      const result = authReducer(initialState, setCredentials(user));
      
      expect(result.user).toEqual(user);
      expect(result.token).toBe('abc123');
      expect(result.isAuthenticated).toBe(true);
    });

    it('should handle setCredentials with user and token separately', () => {
      const payload = { user: { _id: '123', name: 'Test' }, token: 'xyz789' };
      const result = authReducer(initialState, setCredentials(payload));
      
      expect(result.user).toEqual(payload.user);
      expect(result.token).toBe('xyz789');
      expect(result.isAuthenticated).toBe(true);
    });

    it('should handle updateUserInfo', () => {
      const stateWithUser = {
        ...initialState,
        user: { _id: '123', name: 'Old Name', email: 'old@example.com' },
        isAuthenticated: true,
      };
      
      const result = authReducer(stateWithUser, updateUserInfo({ name: 'New Name' }));
      
      expect(result.user.name).toBe('New Name');
      expect(result.user.email).toBe('old@example.com');
    });

    it('should handle logout', () => {
      const stateWithUser = {
        user: { _id: '123', name: 'Test' },
        token: 'abc123',
        isAuthenticated: true,
        isLoading: false,
      };
      
      const result = authReducer(stateWithUser, logout());
      
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should handle setLoading', () => {
      const result = authReducer(initialState, setLoading(true));
      expect(result.isLoading).toBe(true);
      
      const result2 = authReducer(result, setLoading(false));
      expect(result2.isLoading).toBe(false);
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'abc123',
        isAuthenticated: true,
        isLoading: false,
      },
    };

    it('selectCurrentUser should return the user', () => {
      expect(selectCurrentUser(mockState)).toEqual({ _id: '123', name: 'Test User' });
    });

    it('selectIsAuthenticated should return auth status', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('selectAuthToken should return the token', () => {
      expect(selectAuthToken(mockState)).toBe('abc123');
    });
  });
});
