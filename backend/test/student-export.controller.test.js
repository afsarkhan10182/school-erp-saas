require('module-alias/register');
const assert = require('assert');
const StudentController = require('../src/controllers/academic/student.controller');

describe('Student export scoping', () => {
  it('keeps Branch Admin exports in their assigned branch and applies list filters', async () => {
    const { Student } = require('../src/models');
    const originalFindAll = Student.findAll;
    let csv;
    let contentType;
    let filename;
    try {
      Student.findAll = async options => {
        assert.deepStrictEqual(
          {
            school_id: options.where.school_id,
            branch_id: options.where.branch_id,
            class_id: options.where.class_id
          },
          {
            school_id: 'school-demo',
            branch_id: 'branch-second',
            class_id: 'class-second'
          }
        );
        assert.ok(options.where[require('sequelize').Op.or]);
        assert.strictEqual(options.include[0].as, 'parents');
        return [
          {
            toJSON: () => ({
              admission_number: '=2+3',
              first_name: 'Riya',
              last_name: 'Demo',
              class: { name: 'Class 2' },
              sectionInfo: { name: 'A' },
              parents: [{ guardian_name: 'Demo Parent', guardian_phone: '90000' }]
            })
          }
        ];
      };
      const response = {
        status(code) {
          assert.strictEqual(code, 200);
          return this;
        },
        type(value) {
          contentType = value;
          return this;
        },
        attachment(value) {
          filename = value;
          return this;
        },
        send(value) {
          csv = value;
          return this;
        }
      };
      await StudentController.exportStudentReport(
        {
          user: { role: 'branch_admin', branch_id: 'branch-second' },
          schoolId: 'school-demo',
          query: {
            branch_id: 'branch-main',
            class_id: 'class-second',
            search: 'Riya'
          }
        },
        response,
        error => {
          if (error) throw error;
        }
      );
      assert.strictEqual(contentType, 'text/csv; charset=utf-8');
      assert.strictEqual(filename, 'students.csv');
      assert.match(csv, /Admission Number/);
      assert.match(csv, /'=2\+3/);
      assert.match(csv, /Riya Demo,Class 2,A/);
    } finally {
      Student.findAll = originalFindAll;
    }
  });

  it('requires Platform Owner exports to select one school', async () => {
    let status;
    let message;
    await StudentController.exportStudentReport(
      {
        user: { role: 'super_admin' },
        query: {}
      },
      {},
      error => {
        status = error.statusCode;
        message = error.message;
      }
    );
    assert.strictEqual(status, 400);
    assert.match(message, /School ID is required/);
  });
});
