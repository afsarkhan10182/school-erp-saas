require('module-alias/register');

const { Timetable } = require('../src/models');
const TimetableService = require('../src/services/academic/timetable.service');

describe('teacher timetable grouping', () => {
  const originalFindAll = Timetable.findAll;

  afterEach(() => {
    Timetable.findAll = originalFindAll;
  });

  it('maps numeric weekdays into the teacher schedule and skips invalid day values', async () => {
    const slot = day => ({ day_of_week: day, toJSON: () => ({ day_of_week: day }) });
    Timetable.findAll = jest.fn().mockResolvedValue([
      { class: { id: 'class-1' }, section: { id: 'section-1' }, slots: [slot(1), slot(7), slot(8)] }
    ]);

    const result = await TimetableService.getTeacherTimetable('teacher-1', '2026-2027', {
      id: 'teacher-1',
      role: 'teacher',
      school_id: 'school-1'
    });

    expect(result.schedule.monday).toEqual([
      { day_of_week: 1, class: { id: 'class-1' }, section: { id: 'section-1' } }
    ]);
    expect(result.schedule.sunday).toEqual([
      { day_of_week: 7, class: { id: 'class-1' }, section: { id: 'section-1' } }
    ]);
    expect(Object.values(result.schedule).flat()).toHaveLength(2);
  });
});
