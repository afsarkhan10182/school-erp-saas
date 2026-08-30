/** Default home after login by role (student/parent → portal). */
export const homePathForRole = (role?: string | null) => {
  if (role === 'student' || role === 'parent') return '/portal';
  return '/dashboard';
};
