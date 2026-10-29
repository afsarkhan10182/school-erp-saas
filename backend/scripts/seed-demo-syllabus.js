require('module-alias/register');
require('dotenv').config();

const { sequelize, School, Branch, Class, Subject, User, SyllabusUnit } = require('../src/models');

const ensureUnit = (values, transaction) =>
  SyllabusUnit.findOrCreate({
    where: {
      school_id: values.school_id,
      branch_id: values.branch_id,
      class_id: values.class_id,
      subject_id: values.subject_id,
      parent_id: values.parent_id,
      title: values.title
    },
    defaults: values,
    transaction
  });

async function run() {
  const transaction = await sequelize.transaction();
  try {
    const school = await School.findOne({ where: { code: 'DEMOERP' }, transaction });
    if (!school) throw new Error('DEMOERP school is missing');
    const main = await Branch.findOne({
      where: { school_id: school.id, code: 'MAIN' },
      transaction
    });
    const second = await Branch.findOne({
      where: { school_id: school.id, code: 'SECOND' },
      transaction
    });
    const mainClass = await Class.findOne({
      where: { school_id: school.id, branch_id: main?.id, code: 'C1' },
      transaction
    });
    const secondClass = await Class.findOne({
      where: { school_id: school.id, branch_id: second?.id, code: 'C2-SECOND' },
      transaction
    });
    const math = await Subject.findOne({
      where: { school_id: school.id, branch_id: main?.id, code: 'MATH', class_id: mainClass?.id },
      transaction
    });
    const english = await Subject.findOne({
      where: {
        school_id: school.id,
        branch_id: second?.id,
        code: 'ENG-SECOND',
        class_id: secondClass?.id
      },
      transaction
    });
    const admin = await User.findOne({
      where: { school_id: school.id, role: 'admin' },
      transaction
    });
    if (!main || !second || !mainClass || !secondClass || !math || !english || !admin) {
      throw new Error('Required DEMOERP branch, class, subject, or admin fixture is missing');
    }
    const [chapter] = await ensureUnit(
      {
        school_id: school.id,
        branch_id: main.id,
        class_id: mainClass.id,
        subject_id: math.id,
        parent_id: null,
        title: 'Number Sense',
        description: 'Understand numbers, place value, and operations.',
        created_by: admin.id
      },
      transaction
    );
    await ensureUnit(
      {
        school_id: school.id,
        branch_id: main.id,
        class_id: mainClass.id,
        subject_id: math.id,
        parent_id: chapter.id,
        title: 'Addition and Subtraction',
        description: 'Solve age-appropriate addition and subtraction problems.',
        created_by: admin.id
      },
      transaction
    );
    await ensureUnit(
      {
        school_id: school.id,
        branch_id: second.id,
        class_id: secondClass.id,
        subject_id: english.id,
        parent_id: null,
        title: 'Reading and Writing',
        description: 'Build reading comprehension and clear written expression.',
        created_by: admin.id
      },
      transaction
    );
    await transaction.commit();
    process.stdout.write('DEMOERP syllabus fixtures are present in MAIN and SECOND only.\n');
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

run().catch(error => {
  console.error('Demo syllabus seed failed:', error.message);
  process.exitCode = 1;
});
