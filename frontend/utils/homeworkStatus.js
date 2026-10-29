const localDateOnly = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const getHomeworkBuckets = (homeworks, today = localDateOnly()) => {
  const buckets = { pending: [], past: [] };
  for (const homework of homeworks) {
    const isPast = Boolean(homework.submissions?.[0]?.evaluated_at) || homework.due_date < today;
    buckets[isPast ? 'past' : 'pending'].push(homework);
  }
  return buckets;
};
