import { describe, it, expect } from 'vitest';
import uiReducer, {
  showLoading,
  hideLoading,
  addToast,
  removeToast,
  clearAllToasts,
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
  selectIsLoading,
  selectLoadingMessage,
  selectToasts,
  selectActiveModal,
  selectSidebarOpen,
} from '../../store/slices/uiSlice';

describe('uiSlice', () => {
  const initialState = {
    isLoading: false,
    loadingMessage: '',
    toasts: [],
    activeModal: null,
    modalData: null,
    sidebarOpen: true,
  };

  describe('loading reducers', () => {
    it('should handle showLoading', () => {
      const result = uiReducer(initialState, showLoading('Saving...'));
      
      expect(result.isLoading).toBe(true);
      expect(result.loadingMessage).toBe('Saving...');
    });

    it('should handle showLoading with default message', () => {
      const result = uiReducer(initialState, showLoading());
      
      expect(result.isLoading).toBe(true);
      expect(result.loadingMessage).toBe('Loading...');
    });

    it('should handle hideLoading', () => {
      const loadingState = { ...initialState, isLoading: true, loadingMessage: 'Test' };
      const result = uiReducer(loadingState, hideLoading());
      
      expect(result.isLoading).toBe(false);
      expect(result.loadingMessage).toBe('');
    });
  });

  describe('toast reducers', () => {
    it('should handle addToast', () => {
      const result = uiReducer(initialState, addToast({
        message: 'Success!',
        type: 'success',
        title: 'Done',
      }));
      
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].message).toBe('Success!');
      expect(result.toasts[0].type).toBe('success');
      expect(result.toasts[0].title).toBe('Done');
      expect(result.toasts[0].id).toBeDefined();
    });

    it('should handle addToast with defaults', () => {
      const result = uiReducer(initialState, addToast({ message: 'Info' }));
      
      expect(result.toasts[0].type).toBe('info');
      expect(result.toasts[0].duration).toBe(5000);
    });

    it('should handle removeToast', () => {
      const stateWithToast = {
        ...initialState,
        toasts: [{ id: 1, message: 'Test' }],
      };
      
      const result = uiReducer(stateWithToast, removeToast(1));
      expect(result.toasts).toHaveLength(0);
    });

    it('should handle clearAllToasts', () => {
      const stateWithToasts = {
        ...initialState,
        toasts: [
          { id: 1, message: 'Test 1' },
          { id: 2, message: 'Test 2' },
        ],
      };
      
      const result = uiReducer(stateWithToasts, clearAllToasts());
      expect(result.toasts).toHaveLength(0);
    });
  });

  describe('modal reducers', () => {
    it('should handle openModal', () => {
      const result = uiReducer(initialState, openModal({
        modal: 'confirmDelete',
        data: { id: '123' },
      }));
      
      expect(result.activeModal).toBe('confirmDelete');
      expect(result.modalData).toEqual({ id: '123' });
    });

    it('should handle closeModal', () => {
      const stateWithModal = {
        ...initialState,
        activeModal: 'test',
        modalData: { foo: 'bar' },
      };
      
      const result = uiReducer(stateWithModal, closeModal());
      expect(result.activeModal).toBeNull();
      expect(result.modalData).toBeNull();
    });
  });

  describe('sidebar reducers', () => {
    it('should handle toggleSidebar', () => {
      const result = uiReducer(initialState, toggleSidebar());
      expect(result.sidebarOpen).toBe(false);
      
      const result2 = uiReducer(result, toggleSidebar());
      expect(result2.sidebarOpen).toBe(true);
    });

    it('should handle setSidebarOpen', () => {
      const result = uiReducer(initialState, setSidebarOpen(false));
      expect(result.sidebarOpen).toBe(false);
    });
  });

  describe('selectors', () => {
    const mockState = {
      ui: {
        isLoading: true,
        loadingMessage: 'Loading data...',
        toasts: [{ id: 1, message: 'Test' }],
        activeModal: 'testModal',
        modalData: { test: true },
        sidebarOpen: false,
      },
    };

    it('selectIsLoading should return loading state', () => {
      expect(selectIsLoading(mockState)).toBe(true);
    });

    it('selectLoadingMessage should return loading message', () => {
      expect(selectLoadingMessage(mockState)).toBe('Loading data...');
    });

    it('selectToasts should return toasts array', () => {
      expect(selectToasts(mockState)).toHaveLength(1);
    });

    it('selectActiveModal should return active modal', () => {
      expect(selectActiveModal(mockState)).toBe('testModal');
    });

    it('selectSidebarOpen should return sidebar state', () => {
      expect(selectSidebarOpen(mockState)).toBe(false);
    });
  });
});
