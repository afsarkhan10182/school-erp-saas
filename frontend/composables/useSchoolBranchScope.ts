import { computed, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';

/**
 * useSchoolBranchScope — backward-compatible thin wrapper over useGlobalBranch.
 *
 * Previously this composable maintained its OWN local branch/school state and
 * fetched branches independently on each page. Now it simply reads from the
 * global branch context (authStore + useGlobalBranch) that the topbar BranchSelector
 * writes to.
 *
 * Migration: replace `loadScope()` calls with a `watch(selectedBranchId, reload)`.
 * The `loadScope()` function is now a no-op kept only for backward compatibility.
 */
export function useSchoolBranchScope() {
  const auth = useAuthStore();
  const {
    selectedBranchId: globalBranchId,
    currentBranch,
    availableBranches,
    currentSchool,
    isSuperAdmin,
    showBranchSelector,
    branchScopeParams
  } = useGlobalBranch();

  // Branch options derived from the global available branches
  const branchOptions = computed(() =>
    (availableBranches.value || []).map((b: any) => ({
      label: b.name || b.code || b.id,
      value: b.id
    }))
  );

  // School options are not maintained here anymore — use useGlobalBranch directly
  // for super_admin school switching (it happens in the topbar BranchSelector).
  const schoolOptions = ref<Array<{ label: string; value: string }>>([]);

  // Selected branch id — reads from global store
  const selectedBranchId = globalBranchId;

  // Selected school id — reads from global store
  const selectedSchoolId = computed(() => auth.currentSchool?.id || auth.user?.school_id || '');

  /**
   * Whether a branch dropdown should be shown ON A PAGE.
   * After migration this should always return false because the topbar handles it.
   * Kept here for any remaining legacy usage during the transition.
   */
  const showBranchDropdown = computed(() => false);

  /**
   * Scope params for API calls — reads from global store.
   */
  const scopeParams = branchScopeParams;

  /**
   * loadScope — now a no-op.
   * The topbar BranchSelector + layout's fetchBranchesForUser() already handles loading.
   * Pages should use: watch(selectedBranchId, () => reload(), { immediate: true })
   */
  const loadScope = async () => {
    // No-op: branches are already loaded by the layout's fetchBranchesForUser()
    // and the topbar BranchSelector handles school switching for super_admin.
  };

  /**
   * onSchoolChange — no-op, school switching happens in the topbar.
   */
  const onSchoolChange = async () => {};

  return {
    schoolOptions,
    branchOptions,
    selectedSchoolId,
    selectedBranchId,
    showSchoolDropdown: computed(() => false),
    showBranchDropdown,
    scopeParams,
    loadScope,
    onSchoolChange
  };
}
