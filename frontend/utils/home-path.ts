/** Default home after login by role (student/parent → portal). */
export const homePathForRole = (role?: string | null) => {
  if (role === 'student' || role === 'parent') return '/portal';
  if (role === 'teacher') return '/homework';
  return '/dashboard';
};
