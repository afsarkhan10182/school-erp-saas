require('module-alias/register');

const { Op } = require('sequelize');
const { Exam, ExamSchedule, Student } = require('../src/models');
const ExamService = require('../src/services/academic/exam.service');

describe('exam marks upload roster scope', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses only active students in scheduled class/sections and the exam branch', async () => {
    jest.spyOn(Exam, 'findOne').mockResolvedValue({
      id: 'exam-second',
      school_id: 'school-1',
      branch_id: 'branch-second',
      max_marks: 100
    });
    jest.spyOn(ExamSchedule, 'findAll').mockResolvedValue([
      { class_id: 'class-second', section_id: 'section-a' },
      { class_id: 'class-third', section_id: null },
      { class_id: null, section_id: null }
    ]);
    jest.spyOn(Student, 'findAll').mockResolvedValue([]);
    jest.spyOn(ExamService, 'processCSVFile').mockResolvedValue([]);

    await ExamService.uploadMarksFile(
      'exam-second',
      { originalname: 'marks.csv', filename: 'marks.csv' },
      { school_id: 'school-1', branch_id: 'branch-second', role: 'branch_admin' }
    );

    expect(Exam.findOne).toHaveBeenCalledWith({
      where: { id: 'exam-second', school_id: 'school-1', branch_id: 'branch-second' }
    });
    expect(ExamSchedule.findAll).toHaveBeenCalledWith({
      where: {
        exam_id: 'exam-second',
        school_id: 'school-1',
        branch_id: 'branch-second',
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: ['class_id', 'section_id']
    });
    expect(Student.findAll).toHaveBeenCalledWith({
      where: {
        school_id: 'school-1',
        branch_id: 'branch-second',
        status: 'active',
        [Op.or]: [
          { class_id: 'class-second', section_id: 'section-a' },
          { class_id: 'class-third' }
        ]
      },
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number'],
      order: [['roll_number', 'ASC'], ['first_name', 'ASC']]
    });
  });
});
