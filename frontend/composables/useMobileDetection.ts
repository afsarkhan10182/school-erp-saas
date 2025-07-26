import { ref, onMounted, onUnmounted } from 'vue'

export const useMobileDetection = () => {
  const isMobile = ref(false)
  let resizeListener: (() => void) | null = null

  const updateMobileState = () => {
    if (import.meta.client) {
      isMobile.value = window.innerWidth < 768
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      // Get initial state from cookie (set by SSR middleware)
      const mobileCookie = useCookie('is-mobile')
      if (mobileCookie.value) {
        isMobile.value = mobileCookie.value === 'true'
      }
      
      // Update based on actual window size
      updateMobileState()
      
      // Set up resize listener for long-lived sessions
      resizeListener = updateMobileState
      window.addEventListener('resize', resizeListener)
      
      // Also listen for orientation changes on mobile
      window.addEventListener('orientationchange', () => {
        // Small delay to ensure orientation change is complete
        setTimeout(updateMobileState, 100)
      })
    }
  })

  onUnmounted(() => {
    if (import.meta.client && resizeListener) {
      window.removeEventListener('resize', resizeListener)
      window.removeEventListener('orientationchange', resizeListener)
    }
  })

  return {
    isMobile: readonly(isMobile)
  }
} 