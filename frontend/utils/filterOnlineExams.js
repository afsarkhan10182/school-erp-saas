const dateValue = value => (value ? Date.parse(value) : Number.NaN);

export const filterOnlineExams = (exams, filters, now = new Date()) => {
  const search = String(filters.search || '').trim().toLowerCase();
  const nowMs = now instanceof Date ? now.getTime() : Number(now);

  return exams
    .filter(exam => {
      if (filters.class_id && exam.class_id !== filters.class_id) return false;
      if (filters.status && exam.status !== filters.status) return false;
      if (
        search &&
        !`${exam.title || ''} ${exam.class?.name || ''}`.toLowerCase().includes(search)
      ) {
        return false;
      }

      if (filters.window && filters.window !== 'any') {
        const start = dateValue(exam.start_at);
        if (!Number.isFinite(start)) return false;
        const configuredEnd = dateValue(exam.end_at);
        const end = Number.isFinite(configuredEnd)
          ? configuredEnd
          : start + (Number(exam.duration_minutes) || 60) * 60_000;
        if (filters.window === 'upcoming' && start <= nowMs) return false;
        if (filters.window === 'open' && !(start <= nowMs && nowMs <= end)) return false;
        if (filters.window === 'closed' && end >= nowMs) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''));
      }
      const aStart = dateValue(a.start_at);
      const bStart = dateValue(b.start_at);
      const aSort = Number.isFinite(aStart) ? aStart : Number.NEGATIVE_INFINITY;
      const bSort = Number.isFinite(bStart) ? bStart : Number.NEGATIVE_INFINITY;
      return filters.sort === 'start_asc' ? aSort - bSort : bSort - aSort;
    });
};

export const paginateOnlineExams = (exams, page, pageSize) => {
  const size = Math.max(1, Number(pageSize) || 10);
  const offset = (Math.max(1, Number(page) || 1) - 1) * size;
  return exams.slice(offset, offset + size);
};
