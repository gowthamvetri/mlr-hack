import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Global loading overlay
  isLoading: false,
  loadingMessage: '',
  
  // Toast notifications queue
  toasts: [],
  
  // Modal state
  activeModal: null,
  modalData: null,
  
  // Sidebar state
  sidebarOpen: true,
};

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading overlay
    showLoading: (state, action) => {
      state.isLoading = true;
      state.loadingMessage = action.payload || 'Loading...';
    },
    hideLoading: (state) => {
      state.isLoading = false;
      state.loadingMessage = '';
    },
    
    // Toast notifications
    addToast: (state, action) => {
      const { message, type = 'info', duration = 5000, title } = action.payload;
      state.toasts.push({
        id: ++toastId,
        message,
        type, // 'success' | 'error' | 'warning' | 'info'
        duration,
        title,
        createdAt: Date.now(),
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    
    // Modal management
    openModal: (state, action) => {
      const { modal, data } = action.payload;
      state.activeModal = modal;
      state.modalData = data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  showLoading,
  hideLoading,
  addToast,
  removeToast,
  clearAllToasts,
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

// Selectors
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectLoadingMessage = (state) => state.ui.loadingMessage;
export const selectToasts = (state) => state.ui.toasts;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalData = (state) => state.ui.modalData;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;

// Thunk for showing toast with auto-dismiss
export const showToast = (options) => (dispatch) => {
  const toastData = typeof options === 'string' 
    ? { message: options } 
    : options;
  
  dispatch(addToast(toastData));
  
  // Auto-dismiss after duration
  if (toastData.duration !== 0) {
    setTimeout(() => {
      dispatch(removeToast(toastId));
    }, toastData.duration || 5000);
  }
};

// Convenience toast creators
export const showSuccessToast = (message, title) => showToast({ message, title, type: 'success' });
export const showErrorToast = (message, title) => showToast({ message, title, type: 'error' });
export const showWarningToast = (message, title) => showToast({ message, title, type: 'warning' });
export const showInfoToast = (message, title) => showToast({ message, title, type: 'info' });

export default uiSlice.reducer;
