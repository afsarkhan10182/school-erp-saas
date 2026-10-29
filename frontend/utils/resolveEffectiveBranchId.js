export const resolveEffectiveBranchId = (selectedBranchId, branches, isSuperAdmin, currentSchoolId) => {
  if (selectedBranchId) return selectedBranchId;
  if (branches?.length !== 1) return '';

  const [branch] = branches;
  if (isSuperAdmin && !currentSchoolId) return '';
  if (currentSchoolId && branch.school_id && branch.school_id !== currentSchoolId) return '';
  return branch.id || '';
};
