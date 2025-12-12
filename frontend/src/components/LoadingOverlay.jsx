import { useAppSelector, useAppDispatch } from '../store';
import { selectIsLoading, selectLoadingMessage, hideLoading } from '../store/slices/uiSlice';
import { Loader2 } from 'lucide-react';

/**
 * Global loading overlay that displays when ui.isLoading is true.
 * Place this component once at the app root level.
 */
const LoadingOverlay = () => {
  const isLoading = useAppSelector(selectIsLoading);
  const message = useAppSelector(selectLoadingMessage);
  const dispatch = useAppDispatch();

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-700 text-center font-medium">
          {message || 'Loading...'}
        </p>
        <button
          onClick={() => dispatch(hideLoading())}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LoadingOverlay;
