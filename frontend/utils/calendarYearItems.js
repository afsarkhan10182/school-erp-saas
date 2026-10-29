const getScheduledCalendarItems = (events, notices) => [
  ...events.map(event => ({
    id: `event-${event.id}`,
    date: String(event.date || '').slice(0, 10),
    type: 'Event',
    title: event.description || `${event.day_type} school event`,
    details: ''
  })),
  ...notices.map(notice => ({
    id: `notice-${notice.id}`,
    date: String(notice.date_value || notice.created_at || '').slice(0, 10),
    type: 'Notice',
    title: notice.title,
    details: notice.notes || ''
  }))
].filter(item => item.date && item.title);

const sortItems = items =>
  items.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type) || a.title.localeCompare(b.title));

export const getCalendarYearItems = (year, events = [], notices = []) =>
  sortItems(getScheduledCalendarItems(events, notices).filter(item => item.date.startsWith(`${year}-`)));

export const getCalendarWeekRange = dateString => {
  const selectedDate = new Date(`${dateString}T00:00:00.000Z`);
  if (!Number.isFinite(selectedDate.getTime())) return null;
  const start = new Date(selectedDate);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
};

export const getCalendarWeekAgendaItems = (dateString, events = [], notices = [], attendance = []) => {
  const range = getCalendarWeekRange(dateString);
  if (!range) return [];
  const attendanceItems = attendance.map((record, index) => {
    const date = String(record.date || '').slice(0, 10);
    const status = String(record.status || '').replaceAll('_', ' ');
    return {
      id: `attendance-${record.id || `${date}-${status}-${index}`}`,
      date,
      type: 'Attendance',
      title: status ? `${status[0].toUpperCase()}${status.slice(1)}` : 'Attendance recorded',
      details: ''
    };
  });
  return sortItems([...getScheduledCalendarItems(events, notices), ...attendanceItems].filter(
    item => item.date >= range.startDate && item.date <= range.endDate
  ));
};
