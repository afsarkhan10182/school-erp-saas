const formatLocalDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const addMonthsClamped = (date, months) => {
  const month = date.getMonth() + months;
  const lastDay = new Date(date.getFullYear(), month + 1, 0).getDate();
  return new Date(date.getFullYear(), month, Math.min(date.getDate(), lastDay));
};

export const getFeeDueDateRange = (window, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start;
  let end;

  if (window === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (window === 'quarter') {
    const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
    start = new Date(today.getFullYear(), quarterMonth, 1);
    end = new Date(today.getFullYear(), quarterMonth + 3, 0);
  } else if (window === 'next-six-months') {
    start = today;
    end = addMonthsClamped(today, 6);
  } else {
    return { due_from: '', due_to: '' };
  }

  return { due_from: formatLocalDate(start), due_to: formatLocalDate(end) };
};
