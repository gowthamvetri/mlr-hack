import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { selectToasts, removeToast } from '../store/slices/uiSlice';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const toastStyles = {
  success: {
    bg: 'bg-success-50 border-success-200',
    icon: CheckCircle,
    iconColor: 'text-success-500',
    titleColor: 'text-success-800',
    textColor: 'text-success-700',
  },
  error: {
    bg: 'bg-primary-50 border-primary-200',
    icon: AlertCircle,
    iconColor: 'text-primary-500',
    titleColor: 'text-primary-800',
    textColor: 'text-primary-700',
  },
  warning: {
    bg: 'bg-accent-50 border-accent-200',
    icon: AlertTriangle,
    iconColor: 'text-accent-500',
    titleColor: 'text-accent-800',
    textColor: 'text-accent-700',
  },
  info: {
    bg: 'bg-gray-50 border-gray-200',
    icon: Info,
    iconColor: 'text-gray-500',
    titleColor: 'text-gray-800',
    textColor: 'text-gray-700',
  },
};

const Toast = ({ toast, onDismiss }) => {
  const style = toastStyles[toast.type] || toastStyles.info;
  const Icon = style.icon;

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`${style.bg} border rounded-xl p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`font-semibold ${style.titleColor}`}>{toast.title}</p>
        )}
        <p className={`text-sm ${style.textColor} ${toast.title ? 'mt-1' : ''}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`${style.iconColor} hover:opacity-70 flex-shrink-0`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Global toast notification container.
 * Place this component once at the app root level.
 */
const GlobalToast = () => {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  const handleDismiss = (id) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9998] flex flex-col gap-3"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};

export default GlobalToast;
