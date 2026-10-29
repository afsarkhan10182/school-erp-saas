require('module-alias/register');
const { parseSubjectMarkImport } = require('../src/utils/academic/parseSubjectMarkImport');

const roster = [
  { id: 'student-1', admission_number: 'ADM-1', roll_number: '1', first_name: 'Sarah', last_name: 'Demo' }
];
const schedule = { theory_marks: 40, practical_marks: 20, viva_marks: 0, assignment_marks: 10 };

describe('subject marks file preview parser', () => {
  it('matches roster students and parses component marks without writing', () => {
    const result = parseSubjectMarkImport([{
      'Admission Number': 'ADM-1',
      theory_marks: '35',
      practical_marks: 18,
      assignment_marks_obtained: 8,
      'Is Absent': 'FALSE'
    }], roster, schedule);

    expect(result).toEqual({
      records: [{
        student_id: 'student-1',
        theory_marks_obtained: 35,
        practical_marks_obtained: 18,
        viva_marks_obtained: 0,
        assignment_marks_obtained: 8,
        is_absent: false
      }],
      errors: []
    });
  });

  it('rejects unknown/duplicate students and component scores above scheduled limits', () => {
    const result = parseSubjectMarkImport([
      { 'Student Name': 'Outside Student', theory_marks: 10 },
      { 'Admission Number': 'ADM-1', theory_marks: 20 },
      { 'Admission Number': 'ADM-1', theory_marks: 41 }
    ], roster, schedule);

    expect(result.records).toHaveLength(1);
    expect(result.errors).toEqual([
      { row: 2, errors: ['Student does not belong to the selected scheduled class and section'] },
      { row: 4, errors: [
        'Student appears more than once in the file',
        'theory_marks_obtained: enter a number from 0 to 40'
      ] }
    ]);
  });
});
