import { computed, ref } from 'vue';
import { Branches } from '~/api/administration/branches';
import { Schools } from '~/api/administration/schools';
import { useAuthStore } from '~/stores/auth';
import { extractList } from '~/utils/list-response';

export function useSchoolBranchScope() {
  const auth = useAuthStore();
  const schoolOptions = ref<Array<{ label: string; value: string }>>([]);
  const branchOptions = ref<Array<{ label: string; value: string }>>([]);
  const selectedSchoolId = ref('');
  const selectedBranchId = ref('');

  const showSchoolDropdown = computed(() => auth.isSuperAdmin);
  const showBranchDropdown = computed(() => !auth.isBranchAdmin && branchOptions.value.length > 1);
  const scopeParams = computed(() => ({
    ...(selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}),
    ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {})
  }));

  const loadSchools = async () => {
    if (!auth.isSuperAdmin) {
      selectedSchoolId.value = auth.currentSchool?.id || auth.user?.school_id || '';
      return;
    }
    const res: any = await Schools.getAll({ limit: 200, status: 'active' });
    schoolOptions.value = extractList(res, ['schools', 'rows']).map((school: any) => ({
      label: school.name,
      value: school.id
    }));
    selectedSchoolId.value ||= auth.currentSchool?.id || auth.user?.school_id || schoolOptions.value[0]?.value || '';
    const selected = schoolOptions.value.find(school => school.value === selectedSchoolId.value);
    if (selected) auth.setCurrentSchool({ id: selected.value, name: selected.label });
  };

  const loadBranches = async () => {
    const schoolId = selectedSchoolId.value || auth.currentSchool?.id || auth.user?.school_id;
    if (!schoolId && !auth.isSuperAdmin) return;

    const res: any = await Branches.getForDropdown({
      status: 'active',
      ...(schoolId ? { school_id: schoolId } : {})
    });
    branchOptions.value = extractList(res, ['branches', 'rows']).map((branch: any) => ({
      label: branch.name || branch.code || branch.id,
      value: branch.id
    }));
    const preferredBranchId = auth.currentBranch?.id || auth.user?.branch_id || '';
    selectedBranchId.value = branchOptions.value.some(branch => branch.value === preferredBranchId)
      ? preferredBranchId
      : branchOptions.value.length === 1
        ? branchOptions.value[0].value
        : '';
    const selected = branchOptions.value.find(branch => branch.value === selectedBranchId.value);
    auth.setCurrentBranch(selected ? { id: selected.value, name: selected.label, school_id: schoolId } : null);
  };

  const loadScope = async () => {
    await loadSchools();
    await loadBranches();
  };

  const onSchoolChange = async () => {
    const selected = schoolOptions.value.find(school => school.value === selectedSchoolId.value);
    auth.setCurrentSchool(selected ? { id: selected.value, name: selected.label } : null);
    selectedBranchId.value = '';
    auth.setCurrentBranch(null);
    await loadBranches();
  };

  return {
    schoolOptions,
    branchOptions,
    selectedSchoolId,
    selectedBranchId,
    showSchoolDropdown,
    showBranchDropdown,
    scopeParams,
    loadScope,
    onSchoolChange
  };
}
