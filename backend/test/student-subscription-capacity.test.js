require('module-alias/register');

const Student = require('../src/models/academic/student.model');
const School = require('../src/models/administration/school.model');
const SubscriptionPlan = require('../src/models/administration/subscription-plan.model');

describe('student subscription capacity validation', () => {
  const originals = {
    schoolFindByPk: School.findByPk,
    planFindOne: SubscriptionPlan.findOne,
    studentCount: Student.count
  };

  afterEach(() => {
    School.findByPk = originals.schoolFindByPk;
    SubscriptionPlan.findOne = originals.planFindOne;
    Student.count = originals.studentCount;
  });

  it('accounts for valid rows pending in a no-write preview', async () => {
    School.findByPk = jest.fn().mockResolvedValue({ subscription_plan: 'standard' });
    SubscriptionPlan.findOne = jest.fn().mockResolvedValue({ max_students: 3 });
    Student.count = jest.fn().mockResolvedValue(1);

    await expect(Student.validateSubscriptionCapacity('school-a', 1)).resolves.toBeUndefined();
    await expect(Student.validateSubscriptionCapacity('school-a', 2)).rejects.toThrow(
      'Student limit reached'
    );
    expect(Student.count).toHaveBeenCalledWith({
      where: {
        school_id: 'school-a',
        status: { [require('sequelize').Op.ne]: 'deleted' }
      }
    });
  });
});
