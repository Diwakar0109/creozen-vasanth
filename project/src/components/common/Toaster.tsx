import { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastEmitter: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (message: string) => toastEmitter?.(message, 'success'),
  error: (message: string) => toastEmitter?.(message, 'error'),
  info: (message: string) => toastEmitter?.(message, 'info'),
};

export const Toaster = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    toastEmitter = addToast;
    return () => {
      toastEmitter = null;
    };
  }, [addToast]);
  
  const getBgColor = (type: ToastType) => {
    switch(type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  }

  return (
    <div className="fixed top-5 right-5 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-lg text-white shadow-lg text-sm ${getBgColor(toast.type)} animate-fade-in-right`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};