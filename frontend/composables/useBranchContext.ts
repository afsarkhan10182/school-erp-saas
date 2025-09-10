import { ref, computed, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { Branches } from '~/api/administration/branches';

export const useBranchContext = () => {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref('');

  // Computed properties
  const currentBranch = computed(() => authStore.currentBranch);
  const availableBranches = computed(() => authStore.availableBranches);
  const currentSchool = computed(() => authStore.currentSchool);
  const canSwitchBranches = computed(() => {
    const role = authStore.userRole;
    return role === 'super_admin' || role === 'school_admin';
  });

  // Fetch branches for the current user
  const fetchBranches = async () => {
    if (!authStore.isLoggedIn) {
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      let response;

      if (authStore.isSuperAdmin) {
        // Super admin can see all branches
        response = await Branches.getForDropdown();
      } else if (authStore.isSchoolAdmin && authStore.currentSchool) {
        // School admin can see branches of their school
        response = await Branches.getForDropdown({
          school_id: authStore.currentSchool.id
        });
      } else {
        // Other roles can only see their assigned branch
        if (authStore.currentBranch) {
          authStore.setAvailableBranches([authStore.currentBranch]);
        }
        return;
      }

      if (response.success) {
        const branches = response.data || [];
        authStore.setAvailableBranches(branches);

        // Set current branch if not already set
        if (!authStore.currentBranch && branches.length > 0) {
          authStore.setCurrentBranch(branches[0]);
        }
      } else {
        error.value = response.message || 'Failed to fetch branches';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch branches';
    } finally {
      loading.value = false;
    }
  };

  // Switch to a different branch
  const switchBranch = async (branchId: string) => {
    if (!canSwitchBranches.value) return false;

    loading.value = true;
    error.value = '';

    try {
      const success = await authStore.switchBranch(branchId);
      if (success) {
        // Emit event to notify other components about branch change
        if (import.meta.client) {
          window.dispatchEvent(
            new CustomEvent('branch-changed', {
              detail: { branch: authStore.currentBranch }
            })
          );
        }
        return true;
      } else {
        error.value = 'Failed to switch branch';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to switch branch';
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Get branch context for API calls
  const getBranchContext = () => {
    return {
      branchId: authStore.currentBranch?.id,
      schoolId: authStore.currentSchool?.id,
      canAccessAllBranches: authStore.isSuperAdmin
    };
  };

  // Check if user has access to a specific branch
  const hasBranchAccess = (branchId: string) => {
    if (authStore.isSuperAdmin) return true;
    if (authStore.isSchoolAdmin) {
      return authStore.availableBranches.some(b => b.id === branchId);
    }
    return authStore.currentBranch?.id === branchId;
  };

  // Initialize branch context
  const initializeBranchContext = async () => {
    if (authStore.isLoggedIn && authStore.availableBranches.length === 0) {
      await fetchBranches();
    }
  };

  // Watch for auth changes and update branch context
  watch(
    () => authStore.isLoggedIn,
    isLoggedIn => {
      if (isLoggedIn) {
        initializeBranchContext();
      } else {
        authStore.setAvailableBranches([]);
        authStore.setCurrentBranch(null);
      }
    }
  );

  return {
    // State
    loading,
    error,

    // Computed
    currentBranch,
    availableBranches,
    currentSchool,
    canSwitchBranches,

    // Methods
    fetchBranches,
    switchBranch,
    getBranchContext,
    hasBranchAccess,
    initializeBranchContext
  };
};
