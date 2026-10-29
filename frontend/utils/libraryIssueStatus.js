export const getLibraryIssueStatus = (issue, now = new Date()) => {
  if (issue.status === 'returned') return 'returned';

  const dueDate = String(issue.due_date || '').slice(0, 10);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  return dueDate && dueDate < today ? 'overdue' : issue.status;
};
