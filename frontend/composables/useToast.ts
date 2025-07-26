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

  // Utility function to handle API errors and show all validation errors
  const showApiError = (error: any, defaultMessage: string = 'An error occurred', duration?: number) => {
    let errorMessage = defaultMessage;
    
    // Handle validation errors with multiple fields
    if (error?.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat();
      errorMessage = errorMessages.join(', ');
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    showToast(errorMessage, 'error', duration);
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showApiError
  };
}; 