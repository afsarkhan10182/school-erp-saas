export const buildTeacherTimetablePrintReport = ({ timetable, weekDays, periods, academicYear }) => {
  const getSlots = (day, period) =>
    (timetable?.schedule?.[day] || []).filter(slot => slot.period_number === period);

  return {
    title: `Teaching Schedule - ${timetable?.teacher?.first_name || ''} ${timetable?.teacher?.last_name || ''}`.trim(),
    data: weekDays.map(day => ({
      day: day.label,
      ...periods.reduce((row, period) => {
        row[`period_${period.number}`] = getSlots(day.value, period.number).map(slot => [
          slot.slot_type === 'break' || slot.slot_type === 'lunch' ? slot.slot_type : slot.subject?.name,
          slot.timetable?.class?.name,
          slot.timetable?.section?.name,
          slot.start_time && slot.end_time ? `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}` : ''
        ].filter(Boolean).join(' · ')).join('\n') || '—';
        return row;
      }, {})
    })),
    columns: [
      { key: 'day', header: 'Day' },
      ...periods.map(period => ({
        key: `period_${period.number}`,
        header: `Period ${period.number} (${period.startTime}-${period.endTime})`
      }))
    ],
    filters: { academic_year: academicYear },
    reportType: 'timetable'
  };
};
