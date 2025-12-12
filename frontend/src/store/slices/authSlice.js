import { createSlice } from '@reduxjs/toolkit';

// Get initial state from localStorage
const getUserFromStorage = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getUserFromStorage(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!getUserFromStorage(),
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user || action.payload;
      state.token = token || action.payload.token;
      state.isAuthenticated = true;
      // Persist to localStorage
      localStorage.setItem('userInfo', JSON.stringify(state.user));
      if (state.token) {
        localStorage.setItem('token', state.token);
      }
    },
    updateUserInfo: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('userInfo', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateUserInfo, logout, setLoading } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.isLoading;

export default authSlice.reducer;
