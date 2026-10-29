const STUDY_MATERIAL_MANAGERS = new Set(['super_admin', 'admin', 'branch_admin', 'teacher']);

export const canManageStudyMaterials = role => STUDY_MATERIAL_MANAGERS.has(role);
