import { ref, readonly, onMounted, onUnmounted } from 'vue';

// Shared singleton state so all components stay in sync
const isMobileState = ref(false);
let listenerCount = 0;
let resizeListener: (() => void) | null = null;

const updateMobileState = () => {
  if (import.meta.client) {
    isMobileState.value = window.innerWidth < 1024;
  }
};

export const useMobileDetection = () => {
  onMounted(() => {
    if (import.meta.client) {
      if (listenerCount === 0) {
        // Initial check
        updateMobileState();

        resizeListener = updateMobileState;
        window.addEventListener('resize', resizeListener, { passive: true });
        window.addEventListener('orientationchange', () => {
          setTimeout(updateMobileState, 100);
        }, { passive: true });
      }
      listenerCount++;
    }
  });

  onUnmounted(() => {
    if (import.meta.client) {
      listenerCount--;
      if (listenerCount <= 0 && resizeListener) {
        window.removeEventListener('resize', resizeListener);
        resizeListener = null;
        listenerCount = 0;
      }
    }
  });

  return {
    isMobile: readonly(isMobileState)
  };
};

