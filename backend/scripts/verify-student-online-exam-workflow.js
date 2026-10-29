require('module-alias/register');
require('dotenv').config();

const title = `Online exam workflow check ${Date.now()}`;

const baseUrl = process.env.DEMO_API_URL || 'http://localhost:8000/api';
const password = 'Demo@12345';
const target = new URL(baseUrl);
if (
  process.env.NODE_ENV === 'production' ||
  target.protocol !== 'http:' ||
  !['localhost', '127.0.0.1'].includes(target.hostname) ||
  !['localhost', '127.0.0.1', '::1', undefined].includes(process.env.DB_HOST)
) {
  console.error('Student online-exam workflow verification only runs against a local non-production API and database.');
  process.exit(1);
}

const {
  Branch,
  OnlineExam,
  OnlineExamAttempt,
  OnlineExamQuestion,
  School,
  Student,
  User
} = require('../src/models');
const { sequelize } = require('../src/config/database');

async function request(path, cookie, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    redirect: 'error',
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

async function login(email) {
  const result = await request('/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const cookie = result.response.headers.get('set-cookie')?.split(';')[0];
  if (!result.response.ok || !cookie) throw new Error(`${email} login failed (${result.response.status}).`);
  return cookie;
}

async function run() {
  let examId;
  let adminCookie;
  let school;
  let branch;
  let admin;
  let student;
  let studentCookie;
  try {
    school = await School.findOne({ where: { code: 'DEMOERP' } });
    if (!school) throw new Error('DEMOERP is missing; refusing to run against another school.');
    [branch, student, admin] = await Promise.all([
      Branch.findOne({ where: { school_id: school.id, code: 'MAIN' } }),
      Student.findOne({ where: { school_id: school.id, admission_number: 'DEMO-001' } }),
      User.findOne({ where: { school_id: school.id, email: 'demo.admin@schoolerp.local' } })
    ]);
    if (!branch || !student || student.branch_id !== branch.id || !admin) {
      throw new Error('DEMOERP Main Branch online-exam fixtures are incomplete.');
    }

    [adminCookie, studentCookie] = await Promise.all([
      login('demo.admin@schoolerp.local'),
      login('demo.student@schoolerp.local')
    ]);
    const created = await request('/online-exams', adminCookie, {
      method: 'POST',
      body: JSON.stringify({
        title,
        class_id: student.class_id,
        subject_id: null,
        duration_minutes: 10,
        pass_marks: 1,
        total_marks: 1,
        start_at: new Date(Date.now() - 60_000).toISOString(),
        end_at: new Date(Date.now() + 20 * 60_000).toISOString(),
        status: 'published',
        branch_id: branch.id
      })
    });
    examId = created.data?.data?.exam?.id;
    if (created.response.status !== 201 || !examId) {
      throw new Error(`Demo exam creation failed (${created.response.status}).`);
    }

    const question = await request(`/online-exams/${examId}/questions?branch_id=${branch.id}`, adminCookie, {
      method: 'POST',
      body: JSON.stringify({
        question_text: 'Temporary workflow verification: 2 + 2 = ?',
        options_json: ['3', '4'],
        correct_option: 1,
        marks: 1
      })
    });
    const questionId = question.data?.data?.question?.id;
    if (question.response.status !== 201 || !questionId) {
      throw new Error(`Demo question creation failed (${question.response.status}).`);
    }

    const available = await request('/online-exams/available', studentCookie);
    if (!available.response.ok || !available.data.data.exams.some(exam => exam.id === examId)) {
      throw new Error('Student did not see the published class exam.');
    }
    const take = await request(`/online-exams/${examId}/take`, studentCookie);
    const paper = take.data?.data;
    if (
      !take.response.ok ||
      paper?.exam?.questions?.[0]?.id !== questionId ||
      'correct_option' in paper.exam.questions[0]
    ) {
      throw new Error('Student paper was unavailable or exposed the answer key.');
    }

    const answer = await request(`/online-exams/${examId}/attempt`, studentCookie, {
      method: 'PATCH',
      body: JSON.stringify({ answers_json: { [questionId]: 1 } })
    });
    const resumed = await request(`/online-exams/${examId}/take`, studentCookie);
    if (
      !answer.response.ok ||
      resumed.data?.data?.answers_json?.[questionId] !== 1 ||
      resumed.data.data.remaining_seconds > paper.remaining_seconds
    ) {
      throw new Error('Saved answer or remaining-time recovery failed.');
    }

    const submitted = await request(`/online-exams/${examId}/submit`, studentCookie, {
      method: 'POST',
      body: JSON.stringify({ answers_json: { [questionId]: 1 } })
    });
    if (
      !submitted.response.ok ||
      Number(submitted.data.data.score) !== 1 ||
      Number(submitted.data.data.total_marks) !== 1 ||
      submitted.data.data.passed !== true
    ) {
      throw new Error('Student submission did not return the expected score/pass state.');
    }

    const [staffResults, parent] = await Promise.all([
      request(`/online-exams/${examId}/results?branch_id=${branch.id}`, adminCookie),
      User.findOne({ where: { school_id: school.id, email: 'demo.parent@schoolerp.local' } })
    ]);
    if (
      !staffResults.response.ok ||
      !staffResults.data.data.results.some(row => row.admission_number === student.admission_number && Number(row.score) === 1)
    ) {
      throw new Error('Staff results did not read back the submitted Student attempt.');
    }
    if (!parent) throw new Error('DEMOERP Parent fixture is missing.');
    const parentCookie = await login('demo.parent@schoolerp.local');
    const parentProgress = await request(
      `/online-exams/parent/progress?student_id=${student.id}`,
      parentCookie
    );
    if (
      !parentProgress.response.ok ||
      !parentProgress.data.data.attempts.some(
        row => row.exam.id === examId && Number(row.score) === 1 && row.passed === true
      )
    ) {
      throw new Error('Linked Parent did not read back the submitted Student result.');
    }
    const resubmit = await request(`/online-exams/${examId}/take`, studentCookie);
    if (resubmit.response.status !== 409) throw new Error('Submitted attempt could be reopened.');
  } finally {
    try {
      if (!examId && school && branch && admin) {
        const uncertainCreate = await OnlineExam.findOne({
          where: { title, school_id: school.id, branch_id: branch.id, created_by: admin.id }
        });
        examId = uncertainCreate?.id;
      }
      if (examId && school && branch && admin) {
        let removed;
        try {
          removed = await request(
            `/online-exams/${examId}?branch_id=${branch.id}`,
            adminCookie,
            { method: 'DELETE' }
          );
        } catch {}
        if (!removed?.response.ok) {
          await sequelize.transaction(async transaction => {
            await OnlineExamAttempt.destroy({
              where: { online_exam_id: examId, school_id: school.id },
              transaction
            });
            await OnlineExamQuestion.destroy({
              where: { online_exam_id: examId, school_id: school.id },
              transaction
            });
            await OnlineExam.destroy({
              where: { id: examId, school_id: school.id, branch_id: branch.id, created_by: admin.id },
              transaction
            });
          });
        }
        if (await OnlineExam.findOne({ where: { id: examId, school_id: school.id } })) {
          throw new Error(`Temporary online exam cleanup failed for ${examId}.`);
        }
        if (
          (await OnlineExamQuestion.count({ where: { online_exam_id: examId, school_id: school.id } })) ||
          (await OnlineExamAttempt.count({ where: { online_exam_id: examId, school_id: school.id } }))
        ) {
          throw new Error(`Temporary online exam child cleanup failed for ${examId}.`);
        }
      }
    } finally {
      await sequelize.close();
    }
  }

  console.log(
    JSON.stringify(
      {
        passed: true,
        school: 'DEMOERP',
        branch: 'MAIN',
        student: student.admission_number,
        availability: true,
        timer_and_saved_answer_recovery: true,
        submission_and_staff_results: true,
        parent_result: true,
        submitted_attempt_rejected: true,
        exact_exam_cleanup: true
      },
      null,
      2
    )
  );
}

run().catch(error => {
  console.error('Student online-exam workflow verification failed:', error.message);
  process.exitCode = 1;
  return sequelize.close();
});
