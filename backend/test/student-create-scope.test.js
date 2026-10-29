require('module-alias/register');

const { AcademicYear, Class, Section, Stream } = require('../src/models');
const {
  resolveStudentAcademicPlacement
} = require('../src/controllers/academic/student.controller');

describe('student creation academic placement scope', () => {
  const originals = {
    year: AcademicYear.findByPk,
    class: Class.findOne,
    section: Section.findOne,
    stream: Stream.findOne
  };

  beforeEach(() => {
    AcademicYear.findByPk = jest.fn();
    Class.findOne = jest.fn();
    Section.findOne = jest.fn();
    Stream.findOne = jest.fn();
  });

  afterAll(() => {
    AcademicYear.findByPk = originals.year;
    Class.findOne = originals.class;
    Section.findOne = originals.section;
    Stream.findOne = originals.stream;
  });

  it('rejects a class from another branch before accepting its labels', async () => {
    Class.findOne.mockResolvedValue(null);
    const data = { _class_id: 'foreign-class', user_id: 'foreign-user' };

    await expect(
      resolveStudentAcademicPlacement(data, 'school-a', 'branch-a')
    ).rejects.toMatchObject({
      statusCode: 400
    });
    expect(Class.findOne).toHaveBeenCalledWith({
      where: {
        id: 'foreign-class',
        school_id: 'school-a',
        branch_id: 'branch-a',
        is_active: true
      }
    });
    expect(data).not.toHaveProperty('current_class');
  });

  it('validates stream, section, and academic year under the selected placement', async () => {
    Class.findOne.mockResolvedValue({ id: 'class-a', name: 'Class 1' });
    Stream.findOne.mockResolvedValue({ id: 'stream-a', name: 'Science' });
    Section.findOne.mockResolvedValue({ id: 'section-a', name: 'A' });
    AcademicYear.findByPk.mockResolvedValue({ id: 'year-a', name: '2026-2027' });
    const data = {
      class_id: 'class-a',
      stream_id: 'stream-a',
      section_id: 'section-a',
      _academic_year_id: 'year-a',
      user_id: 'foreign-user'
    };

    await resolveStudentAcademicPlacement(data, 'school-a', 'branch-a');

    expect(Stream.findOne).toHaveBeenCalledWith({
      where: {
        id: 'stream-a',
        class_id: 'class-a',
        school_id: 'school-a',
        branch_id: 'branch-a',
        is_active: true
      }
    });
    expect(Section.findOne).toHaveBeenCalledWith({
      where: {
        id: 'section-a',
        class_id: 'class-a',
        stream_id: 'stream-a',
        school_id: 'school-a',
        branch_id: 'branch-a',
        is_active: true
      }
    });
    expect(data).toMatchObject({
      class_id: 'class-a',
      current_class: 'Class 1',
      stream_id: 'stream-a',
      stream: 'Science',
      section_id: 'section-a',
      section: 'A',
      academic_year: '2026-2027'
    });
    expect(data).not.toHaveProperty('user_id');
    expect(data).not.toHaveProperty('_academic_year_id');
  });

  it('rejects a section outside the selected class before writes', async () => {
    Class.findOne.mockResolvedValue({ id: 'class-a', name: 'Class 1' });
    Section.findOne.mockResolvedValue(null);

    await expect(
      resolveStudentAcademicPlacement(
        { _class_id: 'class-a', _section_id: 'foreign-section' },
        'school-a',
        'branch-a'
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
