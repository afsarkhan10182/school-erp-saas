export const getLiveClassMonthRange = (year, month) => ({
  date_from: new Date(year, month, 1).toISOString(),
  date_to: new Date(year, month + 1, 1).toISOString()
});

export const getLiveClassMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { key, day: date.getDate(), inMonth: date.getMonth() === month };
  });
};

export const getLocalCalendarDateKey = value => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
