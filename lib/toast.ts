import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification utilities
 * Provides a modern alternative to window.alert()
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string) => {
    sonnerToast.success(message);
  },

  /**
   * Show an error toast
   */
  error: (message: string) => {
    sonnerToast.error(message);
  },

  /**
   * Show an info toast
   */
  info: (message: string) => {
    sonnerToast.info(message);
  },

  /**
   * Show a warning toast
   */
  warning: (message: string) => {
    sonnerToast.warning(message);
  },
};

