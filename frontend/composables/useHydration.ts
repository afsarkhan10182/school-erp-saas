import { ref, onMounted, readonly } from 'vue';

export const useHydrationState = () => {
  const isHydrated = ref(false);

  onMounted(() => {
    isHydrated.value = true;
  });

  return {
    isHydrated: readonly(isHydrated)
  };
};
