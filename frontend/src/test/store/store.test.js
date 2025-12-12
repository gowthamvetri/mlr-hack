import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import uiReducer from '../../store/slices/uiSlice';
import { api } from '../../services/api';

describe('Redux Store', () => {
  let store;

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(api.middleware),
    });
  });

  it('should have the correct initial state structure', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('ui');
    expect(state).toHaveProperty('api');
  });

  it('should have correct auth initial state', () => {
    const state = store.getState();
    
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.isLoading).toBe(false);
  });

  it('should have correct ui initial state', () => {
    const state = store.getState();
    
    expect(state.ui.isLoading).toBe(false);
    expect(state.ui.toasts).toEqual([]);
    expect(state.ui.sidebarOpen).toBe(true);
  });

  it('should dispatch actions correctly', () => {
    const { setCredentials } = require('../../store/slices/authSlice');
    
    store.dispatch(setCredentials({
      _id: '123',
      name: 'Test User',
      token: 'abc123',
    }));

    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user.name).toBe('Test User');
  });

  it('should handle multiple dispatches', () => {
    const { showLoading, hideLoading, addToast } = require('../../store/slices/uiSlice');
    
    store.dispatch(showLoading('Test'));
    expect(store.getState().ui.isLoading).toBe(true);
    
    store.dispatch(hideLoading());
    expect(store.getState().ui.isLoading).toBe(false);
    
    store.dispatch(addToast({ message: 'Test toast', type: 'success' }));
    expect(store.getState().ui.toasts).toHaveLength(1);
  });
});
