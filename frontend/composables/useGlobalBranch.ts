import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

/**
 * useGlobalBranch — single source of truth for the current branch context.
 *
 * This composable is the replacement for per-page `useSchoolBranchScope`.
 * The topbar BranchSelector writes to `authStore.currentBranch`.
 * Every page reads from here — no local branch state anywhere.
 */
export function useGlobalBranch() {
  const authStore = useAuthStore();

  // Currently selected branch id (null = "All Branches")
  const selectedBranchId = computed<string>(
    () => authStore.currentBranch?.id || authStore.user?.branch_id || ''
  );

  // Currently selected branch object
  const currentBranch = computed(() => authStore.currentBranch);

  // All branches available for the current user
  const availableBranches = computed(() => authStore.availableBranches || []);

  // Currently selected school (for super_admin school switching)
  const currentSchool = computed(() => authStore.currentSchool);

  // Role flags
  const isSuperAdmin = computed(() => authStore.isSuperAdmin);
  const isAdmin = computed(() => authStore.isAdmin);
  const isBranchAdmin = computed(() => authStore.isBranchAdmin);

  /**
   * Whether the topbar branch selector is visible.
   * Hidden for: branch_admin, teachers, students, parents, and single-branch schools.
   */
  const showBranchSelector = computed(() => {
    if (!authStore.isSuperAdmin && !authStore.isAdmin) return false;
    // Show if there's more than 1 branch available
    return (authStore.availableBranches?.length || 0) > 1;
  });

  /**
   * Ready-to-use params object for API calls.
   * Pass as query params: `{ ...branchScopeParams.value }`.
   */
  const branchScopeParams = computed(() => {
    const params: Record<string, string> = {};
    if (authStore.currentSchool?.id && authStore.isSuperAdmin) {
      params.school_id = authStore.currentSchool.id;
    }
    if (authStore.currentBranch?.id) {
      params.branch_id = authStore.currentBranch.id;
    }
    return params;
  });

  /**
   * Switch the active branch.
   * Persists to sessionStorage via authStore.
   */
  const switchBranch = (branchId: string) => {
    if (!branchId) {
      // "All Branches" selected
      authStore.setCurrentBranch(null);
      return;
    }
    const branch = authStore.availableBranches.find((b: any) => b.id === branchId);
    if (branch) {
      authStore.setCurrentBranch(branch);
    }
  };

  /**
   * Switch the active school (super_admin only).
   * Also resets branch to null so pages don't show stale branch data.
   */
  const switchSchool = (school: { id: string; name: string } | null) => {
    authStore.setCurrentSchool(school);
    authStore.setCurrentBranch(null);
    // Caller should re-fetch branches for the new school
  };

  return {
    selectedBranchId,
    currentBranch,
    availableBranches,
    currentSchool,
    isSuperAdmin,
    isAdmin,
    isBranchAdmin,
    showBranchSelector,
    branchScopeParams,
    switchBranch,
    switchSchool
  };
}
