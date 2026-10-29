export const resolveCurrentSchool = (user, selectedSchool) => {
  if (user?.role === 'super_admin') return selectedSchool || null;
  if (!user?.school_id) return null;

  const school = selectedSchool?.id === user.school_id ? selectedSchool : user.school || {};
  return { ...school, id: user.school_id };
};
