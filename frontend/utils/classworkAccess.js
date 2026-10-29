export const canManageClasswork = role => ['super_admin', 'admin', 'branch_admin', 'teacher'].includes(role);
