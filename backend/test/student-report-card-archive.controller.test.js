require('module-alias/register');

const {
  getStudentReportCardArchives,
  downloadStudentReportCardArchive
} = require('../src/controllers/academic/exam-reports/exam-reports.controller');
const { StudentReportCardArchive } = require('../src/models');

describe('Student report-card archive scope', () => {
  const originalFindAll = StudentReportCardArchive.findAll;
  const originalFindOne = StudentReportCardArchive.findOne;

  afterEach(() => {
    StudentReportCardArchive.findAll = originalFindAll;
    StudentReportCardArchive.findOne = originalFindOne;
  });

  it('returns only metadata for the selected student, school, and branch', async () => {
    const studentId = 'a0000000-0000-4000-8000-000000000001';
    const rows = [{ id: 'archive-1', title: 'Term 1 report card', academic_year: '2025-2026' }];
    StudentReportCardArchive.findAll = jest.fn().mockResolvedValue(rows);
    const res = { json: jest.fn() };

    await getStudentReportCardArchives({
      params: { studentId },
      schoolId: 'school-1',
      branchId: 'branch-1',
      user: { role: 'admin' }
    }, res);

    expect(StudentReportCardArchive.findAll).toHaveBeenCalledWith({
      where: { student_id: studentId, school_id: 'school-1', branch_id: 'branch-1' },
      attributes: ['id', 'title', 'academic_year', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: rows });
  });

  it('does not query across tenants when a platform user has no selected school', async () => {
    StudentReportCardArchive.findAll = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getStudentReportCardArchives({
      params: { studentId: 'a0000000-0000-4000-8000-000000000001' },
      user: { role: 'super_admin' }
    }, res);

    expect(StudentReportCardArchive.findAll).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('does not download an archive outside the selected branch', async () => {
    const archiveId = 'b0000000-0000-4000-8000-000000000001';
    StudentReportCardArchive.findOne = jest.fn().mockResolvedValue(null);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await downloadStudentReportCardArchive({
      params: { archiveId },
      schoolId: 'school-1',
      branchId: 'branch-1',
      user: { role: 'branch_admin' }
    }, res);

    expect(StudentReportCardArchive.findOne).toHaveBeenCalledWith({
      where: { id: archiveId, school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
