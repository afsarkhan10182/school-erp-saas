import { ref } from 'vue';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration: number = 5000) => {
    if (import.meta.client) {
      // Dispatch custom event to show toast
      const event = new CustomEvent('show-toast', {
        detail: {
          message,
          type,
          duration
        }
      });
      window.dispatchEvent(event);
    }
  };

  const showSuccess = (message: string, duration?: number) => {
    showToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    showToast(message, 'info', duration);
  };

  const showWarning = (message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
}; 