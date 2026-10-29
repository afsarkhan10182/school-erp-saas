require('module-alias/register');
require('dotenv').config();

const baseUrl = process.env.DEMO_API_URL || 'http://localhost:8000/api';
const email = 'demo.teacher@schoolerp.local';
const password = 'Demo@12345';
const target = new URL(baseUrl);
if (
  process.env.NODE_ENV === 'production' ||
  target.protocol !== 'http:' ||
  !['localhost', '127.0.0.1'].includes(target.hostname) ||
  !['localhost', '127.0.0.1', '::1', undefined].includes(process.env.DB_HOST)
) {
  console.error('Teacher syllabus workflow verification only runs against a local non-production API and database.');
  process.exit(1);
}

const { School, Branch, Student, Subject, SubjectTeacher, SyllabusUnit, User } = require('../src/models');
const { sequelize } = require('../src/config/database');
const { getCurrentAcademicYearForSchool } = require('../src/utils/academic/academicYearUtils');

async function request(path, cookie, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get('content-type') || '';
  return {
    response,
    data: contentType.includes('json') ? await response.json() : await response.text()
  };
}

async function run() {
  const school = await School.findOne({ where: { code: 'DEMOERP' } });
  if (!school) throw new Error('DEMOERP is missing; refusing to run against another school.');
  const [branch, student, teacher] = await Promise.all([
    Branch.findOne({ where: { school_id: school.id, code: 'MAIN' } }),
    Student.findOne({ where: { school_id: school.id, admission_number: 'DEMO-001' } }),
    User.findOne({ where: { school_id: school.id, email } })
  ]);
  if (!branch || !student || !teacher || student.branch_id !== branch.id) {
    throw new Error('DEMOERP Main Branch Teacher/Class fixtures are incomplete.');
  }
  const currentYear = await getCurrentAcademicYearForSchool(school.id);
  const teacherSubject = await SubjectTeacher.findOne({
    where: {
      school_id: school.id,
      teacher_id: teacher.id,
      branch_id: branch.id,
      class_id: student.class_id,
      academic_year: currentYear?.code || currentYear?.name
    },
    attributes: ['class_id', 'subject_id'],
    raw: true
  });
  if (!teacherSubject) throw new Error('Demo Teacher is not assigned to DEMO-001 in the current year.');
  const subject = await Subject.findOne({
    where: { id: teacherSubject.subject_id, school_id: school.id }
  });
  if (!subject) throw new Error('The assigned demo Teacher subject is missing.');

  let createdId;
  let cookie;
  try {
    const login = await request('/auth/login', null, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!login.response.ok) throw new Error(`Teacher login failed (${login.response.status}).`);
    cookie = login.response.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) throw new Error('Teacher login did not return a session cookie.');

    const title = `Syllabus workflow check ${Date.now()}`;
    const created = await request('/syllabus', cookie, {
      method: 'POST',
      body: JSON.stringify({
        class_id: teacherSubject.class_id,
        subject_id: subject.id,
        title,
        description: 'Temporary local integration verification.'
      })
    });
    createdId = created.data?.data?.id;
    if (
      created.response.status !== 201 ||
      !createdId ||
      created.data.data.school_id !== school.id ||
      created.data.data.branch_id !== branch.id ||
      created.data.data.class_id !== teacherSubject.class_id ||
      created.data.data.subject_id !== subject.id ||
      created.data.data.created_by !== teacher.id
    ) {
      throw new Error(`Teacher create failed or returned an unexpected scope (${created.response.status}).`);
    }

    const query = new URLSearchParams({
      class_id: teacherSubject.class_id,
      subject_id: subject.id
    });
    const readback = await request(`/syllabus?${query}`, cookie);
    if (
      !readback.response.ok ||
      !readback.data.data.some(row => row.id === createdId && row.title === title)
    ) {
      throw new Error(`Teacher read-back failed (${readback.response.status}).`);
    }
  } finally {
    try {
      if (createdId) {
        const deleted = await SyllabusUnit.destroy({
          where: {
            id: createdId,
            school_id: school.id,
            branch_id: branch.id,
            created_by: teacher.id
          }
        });
        if (deleted !== 1) throw new Error(`Temporary syllabus cleanup failed for ${createdId}.`);
      }
    } finally {
      await sequelize.close();
    }
  }

  console.log(
    JSON.stringify(
      { passed: true, role: 'teacher', school: 'DEMOERP', create: true, readback: true, exact_row_cleanup: true },
      null,
      2
    )
  );
}

run().catch(error => {
  console.error('Teacher syllabus workflow verification failed:', error.message);
  process.exitCode = 1;
  return sequelize.close();
});
