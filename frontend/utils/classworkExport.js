export const collectClassworkExportRows = async loadPage => {
  const first = await loadPage(1);
  const total = Number(first.pagination?.total || 0);
  const pages = Number(first.pagination?.totalPages || 0);
  const rows = [...(first.data || [])];
  for (let page = 2; page <= pages; page += 1) {
    const next = await loadPage(page);
    if (Number(next.pagination?.total || 0) !== total) throw new Error('Entries changed during export. Please try again.');
    rows.push(...(next.data || []));
  }
  if (rows.length !== total) throw new Error('Could not load every matching entry. Please try again.');
  return rows;
};

const csvCell = value => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export const CLASSWORK_COLUMNS = [
  { key: 'date', header: 'Date', value: row => row.date_value },
  { key: 'entry_type', header: 'Type', value: row => row.entry_type },
  { key: 'title', header: 'Topic', value: row => row.title },
  { key: 'class_name', header: 'Class', value: row => row.class_name },
  { key: 'section_name', header: 'Section', value: row => row.section_name },
  { key: 'subject_name', header: 'Learning area', value: row => row.subject_name },
  { key: 'teacher_name', header: 'Teacher', value: row => row.teacher_name },
  { key: 'notes', header: 'Content / notes', value: row => row.notes }
];

const selectedColumns = keys => CLASSWORK_COLUMNS.filter(column => keys.includes(column.key));
const textCell = value => String(value ?? '').replace(/[\t\r\n]+/g, ' ');

export const classworkTsv = (rows, keys = CLASSWORK_COLUMNS.map(column => column.key)) => {
  const columns = selectedColumns(keys);
  return [columns.map(column => textCell(column.header)).join('\t'), ...rows.map(row => columns.map(column => textCell(column.value(row))).join('\t'))].join('\r\n');
};

export const classworkCsv = (rows, keys = CLASSWORK_COLUMNS.map(column => column.key)) => {
  const columns = selectedColumns(keys);
  return [columns.map(column => csvCell(column.header)).join(','), ...rows.map(row => columns.map(column => csvCell(column.value(row))).join(','))].join('\r\n');
};
