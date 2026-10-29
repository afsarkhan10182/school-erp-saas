const normalizeHeader = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const valueFor = (row, ...names) => {
  const entries = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  for (const name of names) {
    const value = entries.get(normalizeHeader(name));
    if (value != null && String(value).trim() !== '') return value;
  }
  return '';
};
const isTrue = value => ['true', '1', 'yes', 'y'].includes(String(value).trim().toLowerCase());

const parseSubjectMarkImport = (rows, students, schedule) => {
  const limits = {
    theory_marks_obtained: Number(schedule.theory_marks) || 0,
    practical_marks_obtained: Number(schedule.practical_marks) || 0,
    viva_marks_obtained: Number(schedule.viva_marks) || 0,
    assignment_marks_obtained: Number(schedule.assignment_marks) || 0
  };
  const records = [];
  const errors = [];
  const seen = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const admissionNumber = valueFor(row, 'Admission Number', 'admission_number');
    const rollNumber = valueFor(row, 'Roll Number', 'roll_number');
    const studentName = valueFor(row, 'Student Name', 'student_name');
    const componentValues = Object.fromEntries(
      Object.keys(limits).map(field => [
        field,
        valueFor(row, field, field.replace('_obtained', ''))
      ])
    );
    const absentValue = valueFor(row, 'Is Absent', 'is_absent');
    const hasMarks = Object.values(componentValues).some(value => String(value).trim() !== '');
    if (!admissionNumber && !rollNumber && !studentName && !hasMarks && !absentValue) return;

    const student =
      (admissionNumber && students.find(item => String(item.admission_number) === String(admissionNumber))) ||
      (rollNumber && students.find(item => String(item.roll_number) === String(rollNumber))) ||
      (studentName && students.find(
        item => `${item.first_name || ''} ${item.last_name || ''}`.trim().toLowerCase() === String(studentName).trim().toLowerCase()
      ));
    const rowErrors = [];
    if (!student) rowErrors.push('Student does not belong to the selected scheduled class and section');
    if (student && seen.has(student.id)) rowErrors.push('Student appears more than once in the file');
    if (student) seen.add(student.id);

    const is_absent = isTrue(absentValue);
    const marks = {};
    for (const [field, maximum] of Object.entries(limits)) {
      const raw = componentValues[field];
      const value = raw === '' ? 0 : Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > maximum) {
        rowErrors.push(`${field}: enter a number from 0 to ${maximum}`);
      }
      marks[field] = is_absent ? 0 : value;
    }
    if (!hasMarks && !is_absent) rowErrors.push('Enter at least one component mark or mark the student absent');

    if (rowErrors.length) errors.push({ row: rowNumber, errors: rowErrors });
    else records.push({ student_id: student.id, ...marks, is_absent });
  });

  return { records, errors };
};

module.exports = { parseSubjectMarkImport };
