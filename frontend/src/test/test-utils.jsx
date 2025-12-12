import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';
import { api } from '../services/api';

/**
 * Creates a test store with optional preloaded state
 */
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(api.middleware),
    preloadedState,
  });
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }
  
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
