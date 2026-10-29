export const parseStudent360Number = (value, fallback) => {
  if (value == null || String(value).trim() === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const mergeStudent360Filters = (query, filters) => {
  const next = { ...query };
  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value === false) delete next[key];
    else next[key] = String(value);
  }
  return next;
};

export const collectStudent360ExportRows = async loadPage => {
  const firstPage = await loadPage(1);
  const total = Number(firstPage.pagination?.total || 0);
  const totalPages = Number(firstPage.pagination?.totalPages || 0);
  const students = [...(firstPage.data || [])];
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await loadPage(page);
    if (Number(response.pagination?.total || 0) !== total) {
      throw new Error('The student list changed during export. Please try again.');
    }
    students.push(...(response.data || []));
  }
  if (students.length !== total) throw new Error('Could not load every matching student. Please try again.');
  return students;
};

const csvCell = value => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export const student360Csv = students => {
  const columns = [
    ['Admission Number', student => student.admission_number],
    ['Student Name', student => [student.first_name, student.last_name].filter(Boolean).join(' ')],
    ['Class', student => student.class?.name || student.current_class],
    ['Section', student => student.sectionInfo?.name],
    ['Attendance Rate (%)', student => student.risk.attendance_rate],
    ['Marked Attendance Days', student => student.risk.attendance_marked_days],
    ['Past-Due Balance (INR)', student => student.risk.overdue_balance],
    ['Oldest Overdue (Days)', student => student.risk.oldest_overdue_days],
    ['Latest Exam', student => student.risk.latest_result?.exam_name],
    ['Latest Exam Date', student => student.risk.latest_result?.exam_date],
    ['Latest Result (%)', student => student.risk.latest_result?.percentage],
    ['Grade', student => student.risk.latest_result?.grade],
    ['Services', student => [
      student.risk.service_memberships.transport && 'Transport',
      student.risk.service_memberships.hostel && 'Hostel',
      student.risk.service_memberships.library_books_out && (student.risk.service_memberships.library_books_overdue ? 'Library (overdue)' : 'Library')
    ].filter(Boolean).join('; ')],
    ['Warning Signs', student => student.risk.signals.join('; ')]
  ];
  return [columns.map(([header]) => csvCell(header)).join(','), ...students.map(student =>
    columns.map(([, value]) => csvCell(value(student))).join(',')
  )].join('\r\n');
};
