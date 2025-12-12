import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';

// Slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

// RTK Query API
import { api } from '../services/api';

// Configure store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check for RTK Query
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
        ignoredPaths: ['api'],
      },
    }).concat(api.middleware),
  devTools: import.meta.env.DEV,
});

// Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Export store type for TypeScript (optional, for future migration)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;
