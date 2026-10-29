const {
  Student,
  StudentImportBatch,
  StudentImportBatchRow,
  StudentCategory,
  Parent,
  StudentParent,
  ParentTeacherMeetingStudent,
  GatePass,
  AttendanceRecord,
  AttendanceSession,
  ExamPosition,
  ExamResult,
  HomeworkSubmission,
  LibraryIssue,
  OnlineExamAttempt,
  StudentPromotion,
  HostelAllocation,
  StudentTransport,
  Alumni,
  FeeStructure,
  FeeInvoice,
  FeeType,
  AcademicYear,
  Class,
  Section,
  Stream,
  Branch,
  User,
  DynamicEntityRecord,
  FeePayment,
  LibraryBook,
  Exam,
  ExamSchedule,
  GradingSystem,
  GradeScale
} = require('~/models');
const { Op, Transaction } = require('sequelize');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { sequelize } = require('~/config/database');
const getStudentInvoiceTotals = require('~/utils/financial/studentInvoiceTotals');
const Papa = require('papaparse');
const {
  inspectStudentImport,
  mapStudentImportRows,
  STUDENT_IMPORT_FIELDS
} = require('~/utils/academic/studentImportParser');
const { sanitizeEnumFields } = require('~/utils/academic/studentUtils');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
const getExamPassStatus = require('~/utils/academic/examPassStatus');
const {
  appendStudentCondition,
  applyEnrollmentFilter,
  applySiblingFilter
} = require('~/utils/academic/studentFilters');
const { getTeacherStudentWhere } = require('~/utils/academic/teacherStudentScope');
const fs = require('fs').promises;
const { resolveUploadsPath } = require('~/utils/shared/pathHelper');
const {
  getSchoolFilePath,
  getCurrentYear,
  deleteOldProfileImage
} = require('~/utils/shared/storage');

// Utility function to handle ENUM validation errors
const resolveStudentBranch = async (schoolId, branchId) => {
  if (branchId) {
    const branch = await Branch.findOne({
      where: { id: branchId, school_id: schoolId, status: 'active' }
    });
    if (!branch) throw new ApiError(400, 'Invalid branch for this school');
    return branch.id;
  }

  const branches = await Branch.findAll({
    where: { school_id: schoolId, status: 'active' },
    order: [
      ['is_main_branch', 'DESC'],
      ['created_at', 'ASC']
    ],
    limit: 2
  });

  if (branches.length === 1 || branches[0]?.is_main_branch) return branches[0].id;
  throw new ApiError(400, 'Branch ID is required');
};

const getAssignedBranchId = req => {
  if (req.user.role === 'branch_admin' && !req.user.branch_id) {
    throw new ApiError(403, 'Branch assignment is required');
  }
  return req.user.role === 'branch_admin' ? req.user.branch_id : null;
};

const resolveStudentAcademicPlacement = async (data, schoolId, branchId) => {
  const classId = data._class_id || data.class_id;
  const streamId = data._stream_id || data.stream_id;
  const sectionId = data._section_id || data.section_id;
  const hasAcademicYearId = Boolean(data._academic_year_id || data.academic_year_id);
  if (classId) {
    const classRecord = await Class.findOne({
      where: { id: classId, school_id: schoolId, branch_id: branchId, is_active: true }
    });
    if (!classRecord) throw new ApiError(400, 'Class must belong to this school and branch');
    data.class_id = classRecord.id;
    data.admission_class = classRecord.name;
    data.current_class = classRecord.name;
  } else if (sectionId || streamId) {
    throw new ApiError(400, 'A valid class is required for section or stream placement');
  }

  if (streamId) {
    const streamRecord = await Stream.findOne({
      where: {
        id: streamId,
        class_id: classId,
        school_id: schoolId,
        branch_id: branchId,
        is_active: true
      }
    });
    if (!streamRecord)
      throw new ApiError(400, 'Stream must belong to the selected class and branch');
    data.stream_id = streamRecord.id;
    data.stream = streamRecord.name;
  }

  if (sectionId) {
    const sectionRecord = await Section.findOne({
      where: {
        id: sectionId,
        class_id: classId,
        stream_id: streamId || null,
        school_id: schoolId,
        branch_id: branchId,
        is_active: true
      }
    });
    if (!sectionRecord)
      throw new ApiError(400, 'Section must belong to the selected class and branch');
    data.section_id = sectionRecord.id;
    data.section = sectionRecord.name;
  }

  if (data._academic_year_id) {
    const year = await AcademicYear.findByPk(data._academic_year_id);
    if (!year) throw new ApiError(400, 'Academic year not found');
    data.academic_year = year.name;
  }

  delete data._class_id;
  delete data._section_id;
  delete data._stream_id;
  delete data._academic_year_id;
  delete data.academic_year_id;
  delete data.user_id;
  if (!classId) {
    delete data.class_id;
    delete data.admission_class;
    delete data.current_class;
  }
  if (!sectionId) {
    delete data.section_id;
    delete data.section;
  }
  if (!streamId) {
    delete data.stream_id;
    delete data.stream;
  }
  return hasAcademicYearId;
};

const setCategoryId = async (data, req) => {
  const categoryId = data.category_id;
  if (!categoryId) {
    delete data.category_id;
    return;
  }

  const category = await StudentCategory.findOne({
    where: {
      id: categoryId,
      school_id: req.user.role === 'super_admin' ? req.schoolId || data.school_id : req.schoolId,
      ...(req.user.role === 'branch_admin' && req.user.branch_id
        ? { branch_id: req.user.branch_id }
        : {})
    }
  });
  if (!category) throw new ApiError(400, 'Invalid student category');

  data.category_id = category.id;
  data.category = 'other';
};

const extractAcademicPlacement = (source, academicUpdates) => {
  const nestedStudent = source.student && typeof source.student === 'object' ? source.student : {};
  for (const field of ['class_id', 'section_id', 'stream_id', 'academic_year_id']) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      academicUpdates[`_${field}`] = source[field];
    } else if (Object.prototype.hasOwnProperty.call(nestedStudent, field)) {
      academicUpdates[`_${field}`] = nestedStudent[field];
    }
  }
};

const ADMISSION_EXTRA_KEYS = [
  'present_address',
  'permanent_address',
  'sibling_admission_number',
  'sibling_details',
  'previous_school_name',
  'previous_school_qualification',
  'previous_school_remarks',
  'house',
  'pen',
  'apaar_id',
  'sr_no',
  'previous_software_id',
  'transport_route_id',
  'transport_route',
  'transport_vehicle_id',
  'transport_vehicle',
  'transport_stop_id',
  'transport_stop'
];

const applyAdmissionExtras = async (studentData, customFieldValues, schoolId) => {
  const documents =
    studentData.documents && typeof studentData.documents === 'object'
      ? { ...studentData.documents }
      : {};
  documents.admission_extras = { ...(documents.admission_extras || {}) };
  ADMISSION_EXTRA_KEYS.forEach(key => {
    if (studentData[key] !== undefined) documents.admission_extras[key] = studentData[key] || null;
    delete studentData[key];
  });

  const fields = await DynamicEntityRecord.findAll({
    where: { school_id: schoolId, entity_type: 'custom_field', status: 'active' }
  });
  const activeFields = fields
    .map(field => ({ id: field.id, ...(field.payload || {}) }))
    .filter(field => field.is_active !== false && field.show_on_admission !== false);
  const errors = {};
  activeFields.forEach(field => {
    const value = customFieldValues?.[field.id];
    if (field.is_required && field.field_type !== 'checkbox' && !String(value || '').trim()) {
      errors[`custom_fields.${field.id}`] = `${field.title || 'Custom field'} is required`;
    }
  });
  if (Object.keys(errors).length) {
    throw new ApiError(400, 'Please complete required custom fields', { errors });
  }
  documents.custom_fields = { ...(documents.custom_fields || {}), ...(customFieldValues || {}) };
  documents.custom_field_labels = {
    ...(documents.custom_field_labels || {}),
    ...activeFields.reduce((labels, field) => {
      labels[field.id] = field.title || field.id;
      return labels;
    }, {})
  };
  studentData.documents = documents;
};

const getTeacherStudentScope = async (req, academicYear) => {
  const year = academicYear || (await getCurrentAcademicYearForSchool(req.schoolId))?.code;
  return {
    year,
    where: await getTeacherStudentWhere({
      teacherId: req.user.id,
      schoolId: req.schoolId,
      academicYear: year
    })
  };
};

const handleEnumValidationError = error => {
  if (error.message && error.message.includes('enum_students_admission_sought_in')) {
    throw new ApiError(
      400,
      'Please select a valid stream (Arts, Commerce, or Science) or leave it empty.'
    );
  }
  if (error.message && error.message.includes('enum_students_gender')) {
    throw new ApiError(400, 'Please select a valid gender (Male, Female, or Other).');
  }
  if (error.message && error.message.includes('enum_students_category')) {
    throw new ApiError(400, 'Please select a valid category (General, OBC, SC, ST, or Other).');
  }
  if (error.message && error.message.includes('enum_students_status')) {
    throw new ApiError(
      400,
      'Please select a valid status (Active, Inactive, Transferred, Graduated, or Dropped).'
    );
  }
  // Re-throw other errors
  throw error;
};

// Create a new student
const createStudent = async (req, res, next) => {
  try {
    // Handle both FormData and JSON formats
    let studentData = {};
    let guardianData = {};
    let customFieldValues = {};

    try {
      // Check if data is sent as FormData with JSON string
      if (req.body.studentData) {
        const parsedData = JSON.parse(req.body.studentData);

        // Extract student data from nested structure
        if (parsedData.student && typeof parsedData.student === 'object') {
          studentData = { ...parsedData.student };
        } else {
          studentData = { ...parsedData };
        }

        // Extract guardian data
        if (parsedData.guardian && typeof parsedData.guardian === 'object') {
          guardianData = { ...parsedData.guardian };
        }
        if (parsedData.custom_fields && typeof parsedData.custom_fields === 'object') {
          customFieldValues = { ...parsedData.custom_fields };
        }

        // Always merge root-level academic fields with student data
        if (parsedData.school_id) studentData.school_id = parsedData.school_id;
        if (parsedData.branch_id) studentData.branch_id = parsedData.branch_id;
        if (parsedData.admission_number) studentData.admission_number = parsedData.admission_number;
        if (parsedData.roll_number) studentData.roll_number = parsedData.roll_number;
        if (parsedData.admission_date) studentData.admission_date = parsedData.admission_date;
        if (parsedData.category) studentData.category = parsedData.category;
        if (parsedData.category_id) studentData.category_id = parsedData.category_id;
        if (parsedData.class_id) studentData._class_id = parsedData.class_id;
        if (parsedData.section_id) studentData._section_id = parsedData.section_id;
        if (parsedData.academic_year_id)
          studentData._academic_year_id = parsedData.academic_year_id;
        if (parsedData.stream_id) studentData._stream_id = parsedData.stream_id;

        if (studentData.mobile_no) studentData.phone = studentData.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData)
          studentData.admission_type = parsedData.admission_type;
      } else {
        // Direct nested object (already parsed)
        if (req.body.student && typeof req.body.student === 'object') {
          studentData = { ...req.body.student };
        } else {
          studentData = { ...req.body };
        }

        // Extract guardian data
        if (req.body.guardian && typeof req.body.guardian === 'object') {
          guardianData = { ...req.body.guardian };
        }
        if (req.body.custom_fields && typeof req.body.custom_fields === 'object') {
          customFieldValues = { ...req.body.custom_fields };
        }

        // Always merge root-level academic fields with student data
        if (req.body.admission_number) studentData.admission_number = req.body.admission_number;
        if (req.body.roll_number) studentData.roll_number = req.body.roll_number;
        if (req.body.admission_date) studentData.admission_date = req.body.admission_date;
        if (req.body.category) studentData.category = req.body.category;
        if (req.body.category_id) studentData.category_id = req.body.category_id;
        if (req.body.class_id) studentData._class_id = req.body.class_id;
        if (req.body.section_id) studentData._section_id = req.body.section_id;
        if (req.body.academic_year_id) studentData._academic_year_id = req.body.academic_year_id;
        if (req.body.stream_id) studentData._stream_id = req.body.stream_id;
      }

      if (!studentData._class_id && studentData.class_id)
        studentData._class_id = studentData.class_id;
      if (!studentData._section_id && studentData.section_id)
        studentData._section_id = studentData.section_id;
      if (!studentData._stream_id && studentData.stream_id)
        studentData._stream_id = studentData.stream_id;
      if (!studentData._academic_year_id && studentData.academic_year_id)
        studentData._academic_year_id = studentData.academic_year_id;

      // Ensure critical fields are properly extracted from nested structure
      if (req.body.student && req.body.student.gender) {
        studentData.gender = req.body.student.gender;
      }
      if (req.body.student && req.body.student.first_name) {
        studentData.first_name = req.body.student.first_name;
      }
      if (req.body.student && req.body.student.last_name) {
        studentData.last_name = req.body.student.last_name;
      }
      if (req.body.student && req.body.student.date_of_birth) {
        studentData.date_of_birth = req.body.student.date_of_birth;
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Fallback to flat structure
      studentData = { ...req.body };
    }

    // Handle file uploads
    if (req.files && req.files.student_profile_picture) {
      studentData.profile_picture = req.files.student_profile_picture[0].filename;
    }

    // Determine school_id and branch_id based on user role
    let school_id, branch_id;
    if (req.user.role === 'super_admin') {
      school_id = studentData.school_id;
      branch_id = studentData.branch_id;
      if (!school_id || !branch_id) {
        throw new ApiError(400, 'School ID and Branch ID are required for super admin');
      }
    } else if (req.user.role === 'admin') {
      school_id = req.user.school_id;
      branch_id = studentData.branch_id || req.user.branch_id;
    } else {
      school_id = req.user.school_id;
      branch_id = req.user.branch_id;
    }

    branch_id = await resolveStudentBranch(school_id, branch_id);
    await applyAdmissionExtras(studentData, customFieldValues, school_id);
    const hasAcademicYearId = await resolveStudentAcademicPlacement(
      studentData,
      school_id,
      branch_id
    );

    // Check if student already exists
    const existingStudent = await Student.findOne({
      where: {
        admission_number: studentData.admission_number,
        school_id: school_id
      }
    });

    if (existingStudent) {
      throw new ApiError(409, 'Student with this admission number already exists.', {
        errors: {
          admission_number: 'Student with this admission number already exists.'
        }
      });
    }

    // Check for duplicate roll number in the same class-section-stream combination
    if (studentData.roll_number && studentData._class_id && studentData._section_id) {
      const rollNumberWhere = {
        roll_number: studentData.roll_number,
        branch_id: branch_id,
        class_id: studentData._class_id,
        section_id: studentData._section_id
      };

      // Include stream_id in the check if it's provided (only if not null/undefined)
      if (
        studentData._stream_id &&
        studentData._stream_id !== null &&
        studentData._stream_id !== undefined
      ) {
        rollNumberWhere.stream_id = studentData._stream_id;
      }

      const existingRollNumber = await Student.findOne({
        where: rollNumberWhere
      });

      if (existingRollNumber) {
        const streamName =
          studentData._stream_id &&
          studentData._stream_id !== null &&
          studentData._stream_id !== undefined
            ? `-${studentData._stream_id}`
            : '';
        throw new ApiError(
          400,
          `Roll number ${studentData.roll_number} already exists in this class-section${streamName}.`,
          {
            errors: {
              roll_number: `Roll number ${studentData.roll_number} already exists in this class-section${streamName}.`
            }
          }
        );
      }
    }

    // Handle academic year fallback when none was provided
    if (!hasAcademicYearId) {
      // Fallback to current academic year if no ID provided
      try {
        const currentYear = await getCurrentAcademicYearForSchool(school_id);
        if (currentYear) {
          studentData.academic_year = currentYear.name;
        } else {
          // Last resort: use current year as string
          const currentYearString = new Date().getFullYear().toString();
          studentData.academic_year = `${currentYearString}-${parseInt(currentYearString) + 1}`;
        }
      } catch (error) {
        // Last resort fallback
        const currentYearString = new Date().getFullYear().toString();
        studentData.academic_year = `${currentYearString}-${parseInt(currentYearString) + 1}`;
      }
    }

    // Prepare student data for creation
    const finalStudentData = {
      ...studentData,
      school_id,
      branch_id,
      created_by: req.user.id
    };

    await setCategoryId(finalStudentData, req);

    // Sanitize ENUM fields
    sanitizeEnumFields(finalStudentData);
    // Create student record within a transaction to prevent race conditions
    let student;
    const transaction = await sequelize.transaction();

    try {
      // Re-check for duplicates within transaction to prevent race conditions
      const existingStudentInTx = await Student.findOne({
        where: {
          admission_number: finalStudentData.admission_number,
          school_id: school_id
        },
        transaction
      });

      if (existingStudentInTx) {
        await transaction.rollback();
        throw new ApiError(409, 'Student with this admission number already exists.', {
          errors: {
            admission_number: 'Student with this admission number already exists.'
          }
        });
      }

      // Re-check for duplicate roll number within transaction
      if (
        finalStudentData.roll_number &&
        finalStudentData.class_id &&
        finalStudentData.section_id
      ) {
        const existingRollNumberInTx = await Student.findOne({
          where: {
            roll_number: finalStudentData.roll_number,
            branch_id: branch_id,
            class_id: finalStudentData.class_id,
            section_id: finalStudentData.section_id
          },
          transaction
        });

        if (existingRollNumberInTx) {
          await transaction.rollback();
          throw new ApiError(
            400,
            `Roll number ${finalStudentData.roll_number} already exists in this class-section.`,
            {
              errors: {
                roll_number: `Roll number ${finalStudentData.roll_number} already exists in this class-section.`
              }
            }
          );
        }
      }

      // Create student within transaction
      student = await Student.create(finalStudentData, { transaction });
    } catch (error) {
      await transaction.rollback();
      // Handle ENUM validation errors specifically
      handleEnumValidationError(error);
    }

    // Create guardian/parent record if provided
    if (guardianData && Object.keys(guardianData).length > 0) {
      const siblingAdmissionNumber = student.documents?.admission_extras?.sibling_admission_number;
      const parentData = {
        // Set guardian information based on relation
        guardian_name: guardianData.name,
        guardian_phone: guardianData.mobile_no,
        guardian_email: guardianData.email,
        guardian_relation: guardianData.relation,
        guardian_occupation: guardianData.occupation,
        guardian_income: guardianData.income,
        guardian_education: guardianData.education,
        address: guardianData.address,
        city: guardianData.city,
        state: guardianData.state,
        country: 'India',
        emergency_contact: true, // Set to true since this is the emergency contact
        school_id,
        branch_id,
        created_by: req.user.id
      };

      // Set father or mother information based on relation
      if (guardianData.relation === 'father') {
        parentData.father_name = guardianData.name;
        parentData.father_phone = guardianData.mobile_no;
        parentData.father_email = guardianData.email;
        parentData.father_occupation = guardianData.occupation;
        parentData.father_qualification = guardianData.education;
        parentData.father_income = guardianData.income === '' ? null : guardianData.income;
      } else if (guardianData.relation === 'mother') {
        parentData.mother_name = guardianData.name;
        parentData.mother_phone = guardianData.mobile_no;
        parentData.mother_email = guardianData.email;
        parentData.mother_occupation = guardianData.occupation;
        parentData.mother_qualification = guardianData.education;
        parentData.mother_income = guardianData.income === '' ? null : guardianData.income;
      }

      // Always set both father and mother names if provided
      if (guardianData.father_name) {
        parentData.father_name = guardianData.father_name;
      }
      if (guardianData.mother_name) {
        parentData.mother_name = guardianData.mother_name;
      }

      // Note: Parent model doesn't have enum fields that need sanitization
      // Removed sanitizeEnumFields(parentData) call

      // Check if parent already exists with same phone number in same school/branch
      let parent;
      let existingParent = null;
      if (siblingAdmissionNumber) {
        const sibling = await Student.findOne({
          where: { admission_number: siblingAdmissionNumber, school_id, branch_id },
          transaction
        });
        const siblingParent = sibling
          ? await StudentParent.findOne({
              where: { student_id: sibling.id, is_primary: true },
              include: [{ model: Parent, as: 'parent' }],
              transaction
            })
          : null;
        existingParent = siblingParent?.parent || null;
      }
      existingParent =
        existingParent ||
        (await Parent.findOne({
          where: {
            guardian_phone: parentData.guardian_phone,
            school_id: school_id,
            branch_id: branch_id
          },
          transaction
        }));

      if (existingParent) {
        console.log(
          `🔍 Found existing parent with phone ${parentData.guardian_phone}, linking to existing parent`
        );
        parent = existingParent;
      } else {
        console.log(`🔍 Creating new parent with phone ${parentData.guardian_phone}`);
        parent = await Parent.create(parentData, { transaction });
      }

      // Link student and parent
      await StudentParent.create(
        {
          student_id: student.id,
          parent_id: parent.id,
          school_id,
          relationship: guardianData.relation || 'guardian',
          is_primary: true,
          is_fee_payer: true,
          is_emergency_contact: true
        },
        { transaction }
      );
    }

    // Commit the transaction
    await transaction.commit();

    logger.info(
      `Student created: ${student.first_name} ${student.last_name} (${student.admission_number})`
    );
    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    logger.error('Error creating student:', error);
    return next(error);
  }
};

// Get all students
const getStudents = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const {
      page = 1,
      limit = 10,
      search,
      academic_year,
      class_name,
      section,
      status,
      has_siblings,
      branch_id,
      class_id,
      section_id,
      stream_id,
      school_id,
      category_id,
      enrollment
    } = req.query;

    // Build where clause for Student table
    const whereClause = { status: { [Op.ne]: 'deleted' } };
    let teacherScope;

    // Handle school_id and branch_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin can see all students or filter by school_id
      if (school_id) {
        whereClause.school_id = school_id;
      }
      // If no school_id provided, show all students (no whereClause.school_id restriction)
    } else if (req.user.role === 'admin') {
      // School admin is restricted to their school
      whereClause.school_id = req.schoolId;
    } else if (req.user.role === 'branch_admin') {
      // Branch admin is restricted to their specific branch
      whereClause.school_id = req.schoolId;
      whereClause.branch_id = assignedBranchId;
    } else if (req.user.role === 'teacher') {
      whereClause.school_id = req.schoolId;
      teacherScope = await getTeacherStudentScope(req, academic_year);
      whereClause.academic_year = teacherScope.year;
      appendStudentCondition(whereClause, teacherScope.where);
    } else {
      // Default fallback for other roles
      whereClause.school_id = req.schoolId;
    }

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        {
          admission_number: {
            [Op.and]: [{ [Op.not]: null }, { [Op.iLike]: `%${search}%` }]
          }
        },
        {
          email: {
            [Op.and]: [{ [Op.not]: null }, { [Op.iLike]: `%${search}%` }]
          }
        }
      ];
    }

    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section) whereClause.section = section;
    if (status && status !== 'deleted') whereClause.status = status;
    if (branch_id && req.user.role !== 'branch_admin') whereClause.branch_id = branch_id;

    // Handle class_id and section_id using foreign keys
    if (class_id) {
      whereClause.class_id = class_id;
    }

    if (section_id) {
      whereClause.section_id = section_id;
    }

    if (stream_id) {
      whereClause.stream_id = stream_id;
    }
    if (category_id) whereClause.category_id = category_id;
    await applyEnrollmentFilter(whereClause, enrollment, academic_year);
    await applySiblingFilter(whereClause, has_siblings);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Student.count({ where: whereClause });

    // Get students with pagination
    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
          attributes:
            ['super_admin', 'admin', 'branch_admin'].includes(req.user.role)
              ? [
                  'id',
                  'father_name',
                  'mother_name',
                  'guardian_name',
                  'father_phone',
                  'mother_phone',
                  'guardian_phone'
                ]
              : ['id', 'father_name', 'mother_name', 'guardian_name']
        },
        {
          model: StudentCategory,
          as: 'categoryInfo',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Stream,
          as: 'stream',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['first_name', 'ASC'],
        ['last_name', 'ASC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const studentRecords = students.map(student => student.toJSON());
    const parentIds = [...new Set(studentRecords.flatMap(student =>
      (student.parents || []).map(parent => parent.id)
    ))];
    const siblingLinks = parentIds.length
      ? await StudentParent.findAll({
          attributes: ['parent_id', 'student_id'],
          where: { parent_id: { [Op.in]: parentIds } }
        })
      : [];
    const siblingIds = [...new Set(siblingLinks.map(link => link.student_id))];
    const siblingWhere = { id: { [Op.in]: siblingIds } };
    if (req.user.role === 'super_admin') {
      siblingWhere.school_id = whereClause.school_id || {
        [Op.in]: [...new Set(studentRecords.map(student => student.school_id))]
      };
    } else {
      siblingWhere.school_id = req.schoolId;
    }
    if (req.user.role === 'branch_admin') siblingWhere.branch_id = assignedBranchId;
    if (teacherScope) {
      siblingWhere.academic_year = teacherScope.year;
      siblingWhere[Op.and] = [teacherScope.where];
    }
    const siblingRows = siblingIds.length
      ? await Student.findAll({
          where: siblingWhere,
          attributes: ['id', 'school_id', 'first_name', 'last_name', 'current_class', 'section']
        })
      : [];
    const studentInvoiceTotals = ['super_admin', 'admin', 'branch_admin'].includes(req.user.role)
      ? await getStudentInvoiceTotals(studentRecords)
      : new Map();
    const siblingById = new Map(siblingRows.map(sibling => [sibling.id, sibling]));
    const siblingIdsByParent = new Map();
    siblingLinks.forEach(link => {
      siblingIdsByParent.set(link.parent_id, [
        ...(siblingIdsByParent.get(link.parent_id) || []),
        link.student_id
      ]);
    });
    const data = studentRecords.map(student => {
      const ids = new Set(
        (student.parents || []).flatMap(parent => siblingIdsByParent.get(parent.id) || [])
      );
      return {
        ...student,
        ...(['super_admin', 'admin', 'branch_admin'].includes(req.user.role)
          ? studentInvoiceTotals.get(`${student.school_id}:${student.id}`) || {
              total_billed: 0,
              total_due: 0
            }
          : {}),
        siblings: [...ids]
          .filter(id => id !== student.id)
          .map(id => siblingById.get(id))
          .filter(sibling => sibling && sibling.school_id === student.school_id)
          .map(({ id, first_name, last_name, current_class, section }) => ({
            id, first_name, last_name, current_class, section
          }))
      };
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / limit),
        total_count: totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching students:', error);
    return next(error);
  }
};

// Get student by ID
const getStudentById = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const { id } = req.params;
    const where = {
      id,
      ...(req.user.role === 'super_admin' ? {} : { school_id: req.schoolId })
    };
    if (req.user.role === 'branch_admin') where.branch_id = assignedBranchId;
    let teacherScope;
    if (req.user.role === 'teacher') {
      teacherScope = await getTeacherStudentScope(req);
      where.academic_year = teacherScope.year;
      where[Op.and] = [teacherScope.where];
    }

    const student = await Student.findOne({
      where,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary'] },
          attributes:
            req.user.role === 'teacher'
              ? [
                  'id',
                  'father_name',
                  'mother_name',
                  'guardian_name',
                  'father_phone',
                  'mother_phone',
                  'guardian_phone',
                  'father_email',
                  'mother_email',
                  'guardian_email',
                  'guardian_relation'
                ]
              : [
                  'id',
                  'father_name',
                  'mother_name',
                  'guardian_name',
                  'father_phone',
                  'mother_phone',
                  'guardian_phone',
                  'father_email',
                  'mother_email',
                  'guardian_email',
                  'father_occupation',
                  'mother_occupation',
                  'father_qualification',
                  'mother_qualification',
                  'father_income',
                  'mother_income',
                  'guardian_income',
                  'guardian_education',
                  'guardian_occupation',
                  'guardian_relation',
                  'city',
                  'state',
                  'address'
                ]
        },
        {
          model: StudentCategory,
          as: 'categoryInfo',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Stream,
          as: 'stream',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'status', 'role'],
          required: false
        }
      ]
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const parentIds = student.parents.map(parent => parent.id);
    const [promotionHistory, bookIssues, siblingLinks] = await Promise.all([
      StudentPromotion.findAll({
        where: { student_id: id, school_id: student.school_id },
        order: [['created_at', 'DESC']]
      }),
      LibraryIssue.findAll({
        where: { student_id: id, school_id: student.school_id },
        include: [{ model: LibraryBook, as: 'book', attributes: ['id', 'title'] }],
        order: [['issue_date', 'DESC']]
      }),
      parentIds.length
        ? StudentParent.findAll({
            where: { parent_id: { [Op.in]: parentIds }, student_id: { [Op.ne]: id } },
            attributes: ['student_id']
          })
        : []
    ]);
    const siblingIds = [...new Set(siblingLinks.map(link => link.student_id))];
    const siblingWhere = {
      id: { [Op.in]: siblingIds },
      school_id: student.school_id
    };
    if (teacherScope) {
      siblingWhere.academic_year = teacherScope.year;
      siblingWhere[Op.and] = [teacherScope.where];
    }
    const siblings = siblingIds.length
      ? await Student.findAll({
          where: siblingWhere,
          attributes: [
            'id',
            'first_name',
            'last_name',
            'admission_number',
            'gender',
            'current_class',
            'section',
            'roll_number',
            'phone',
            'photo'
          ]
        })
      : [];

    return res.status(200).json({
      success: true,
      data: {
        ...student.toJSON(),
        promotion_history: promotionHistory,
        book_issues: bookIssues,
        siblings
      }
    });
  } catch (error) {
    logger.error('Error fetching student:', error);
    return next(error);
  }
};

const setStudentAuthentication = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const { id } = req.params;
    const enabled = req.body.enabled;
    if (typeof enabled !== 'boolean') {
      throw new ApiError(400, 'enabled boolean is required');
    }

    const student = await Student.findOne({
      where: {
        id,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: assignedBranchId })
      }
    });
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }
    if (!student.user_id) {
      throw new ApiError(400, 'This student has no login account');
    }

    const user = await User.findByPk(student.user_id);
    if (!user) {
      throw new ApiError(404, 'Login account not found');
    }

    await user.update({ status: enabled ? 'active' : 'inactive' });
    return res.status(200).json({
      success: true,
      message: enabled ? 'Login enabled' : 'Login disabled',
      data: { user_id: user.id, status: user.status }
    });
  } catch (error) {
    logger.error('Error updating student authentication:', error);
    return next(error);
  }
};

// Update student
const updateStudent = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const { id } = req.params;
    const updates = req.body;

    const student = await Student.findOne({
      where: {
        id,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: assignedBranchId })
      }
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Handle both FormData and JSON formats
    let studentUpdates = {};
    let academicUpdates = {};
    let customFieldValues = {};
    let placementSource = updates;

    try {
      // Check if data is sent as FormData with JSON string
      if (updates.studentData) {
        const parsedData = JSON.parse(updates.studentData);
        placementSource = parsedData;

        // Extract student data from nested structure
        if (parsedData.student && typeof parsedData.student === 'object') {
          studentUpdates = { ...parsedData.student };
        } else {
          studentUpdates = { ...parsedData };
        }

        // Extract academic fields from main structure
        if (parsedData.roll_number) studentUpdates.roll_number = parsedData.roll_number;
        if (parsedData.admission_date) academicUpdates.admission_date = parsedData.admission_date;
        if (parsedData.category) academicUpdates.category = parsedData.category;
        if (parsedData.category_id) academicUpdates.category_id = parsedData.category_id;
        if (parsedData.admission_number)
          academicUpdates.admission_number = parsedData.admission_number;

        if (studentUpdates.mobile_no) studentUpdates.phone = studentUpdates.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData)
          studentUpdates.admission_type = parsedData.admission_type;
        if (parsedData.custom_fields && typeof parsedData.custom_fields === 'object') {
          customFieldValues = { ...parsedData.custom_fields };
        }
      } else if (updates.student && typeof updates.student === 'object') {
        // Direct nested object (already parsed) - this is the current case
        studentUpdates = { ...updates.student };
        // Extract academic fields from main structure
        if (updates.roll_number) studentUpdates.roll_number = updates.roll_number;
        if (updates.admission_date) academicUpdates.admission_date = updates.admission_date;
        if (updates.category) academicUpdates.category = updates.category;
        if (updates.category_id) academicUpdates.category_id = updates.category_id;
        if (updates.admission_number) academicUpdates.admission_number = updates.admission_number;

        if (studentUpdates.mobile_no) studentUpdates.phone = studentUpdates.mobile_no;
        if ('admission_type' in updates) studentUpdates.admission_type = updates.admission_type;
        if (updates.custom_fields && typeof updates.custom_fields === 'object') {
          customFieldValues = { ...updates.custom_fields };
        }
      } else {
        // Flat data structure
        studentUpdates = { ...updates };
        console.log('🔍 Using flat data structure:', studentUpdates);
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Fallback to flat structure
      studentUpdates = { ...updates };
      placementSource = updates;
      console.log('🔍 Fallback to flat structure:', studentUpdates);
    }

    extractAcademicPlacement(placementSource, academicUpdates);
    [
      'school_id',
      'branch_id',
      'user_id',
      'class_id',
      'section_id',
      'stream_id',
      'academic_year',
      'academic_year_id',
      'admission_class',
      'current_class',
      'section'
    ].forEach(field => delete studentUpdates[field]);

    // Handle file uploads
    if (req.files && req.files.student_profile_picture) {
      const newProfilePicture = req.files.student_profile_picture[0].filename;
      studentUpdates.profile_picture = newProfilePicture;

      // Delete the old profile picture if it exists and is different
      if (student.profile_picture && student.profile_picture !== newProfilePicture) {
        await deleteOldProfileImage(student, student.profile_picture);
      }
    }

    // Remove any fields that shouldn't be updated directly
    delete studentUpdates.id;
    delete studentUpdates.created_at;
    delete studentUpdates.updated_at;
    delete studentUpdates.created_by;
    studentUpdates.documents = studentUpdates.documents || student.documents || {};
    await applyAdmissionExtras(studentUpdates, customFieldValues, student.school_id);
    const hasPlacement = field =>
      Object.prototype.hasOwnProperty.call(academicUpdates, `_${field}`);
    const classChanged = hasPlacement('class_id');
    let targetClassId = student.class_id;
    if (classChanged) {
      if (!academicUpdates._class_id) throw new ApiError(400, 'A valid class is required');
      const classRecord = await Class.findOne({
        where: {
          id: academicUpdates._class_id,
          school_id: student.school_id,
          branch_id: student.branch_id,
          is_active: true
        }
      });
      if (!classRecord)
        throw new ApiError(400, 'Class must belong to this student school and branch');
      targetClassId = classRecord.id;
      academicUpdates.admission_class = classRecord.name;
      academicUpdates.current_class = classRecord.name;
      academicUpdates.class_id = classRecord.id;
    }
    delete academicUpdates._class_id;

    let targetStreamId = student.stream_id;
    if (hasPlacement('stream_id')) targetStreamId = academicUpdates._stream_id || null;
    else if (classChanged) targetStreamId = null;

    if (hasPlacement('section_id') || (classChanged && student.section)) {
      const sectionId = hasPlacement('section_id') ? academicUpdates._section_id : null;
      if (!sectionId) {
        academicUpdates.section_id = null;
        academicUpdates.section = null;
      } else {
        const sectionRecord = await Section.findOne({
          where: {
            id: sectionId,
            class_id: targetClassId,
            school_id: student.school_id,
            branch_id: student.branch_id,
            stream_id: targetStreamId,
            is_active: true
          }
        });
        if (!sectionRecord)
          throw new ApiError(400, 'Section must belong to the selected class and branch');
        academicUpdates.section = sectionRecord.name;
        academicUpdates.section_id = sectionRecord.id;
      }
    }
    delete academicUpdates._section_id;

    if (hasPlacement('academic_year_id')) {
      const yearId = academicUpdates._academic_year_id;
      if (!yearId) {
        academicUpdates.academic_year = null;
      } else {
        const yearRecord = await AcademicYear.findByPk(yearId);
        if (!yearRecord) throw new ApiError(400, 'Academic year not found');
        academicUpdates.academic_year = yearRecord.name;
      }
    }
    delete academicUpdates._academic_year_id;

    if (hasPlacement('stream_id') || (classChanged && student.stream_id)) {
      const streamId = hasPlacement('stream_id') ? academicUpdates._stream_id : null;
      if (!streamId) {
        academicUpdates.stream_id = null;
        academicUpdates.stream = null;
      } else {
        const streamRecord = await Stream.findOne({
          where: {
            id: streamId,
            class_id: targetClassId,
            school_id: student.school_id,
            branch_id: student.branch_id,
            is_active: true
          }
        });
        if (!streamRecord)
          throw new ApiError(400, 'Stream must belong to the selected class and branch');
        academicUpdates.stream = streamRecord.name;
        academicUpdates.stream_id = streamRecord.id;
      }
    }
    delete academicUpdates._stream_id;

    const updateData = {
      ...studentUpdates,
      ...academicUpdates,
      updated_by: req.user.id
    };

    await setCategoryId(updateData, req);

    const enumFields = ['gender', 'category', 'status', 'admission_sought_in'];
    const suppliedEnumFields = new Set(
      enumFields.filter(field => Object.hasOwn(updateData, field))
    );
    const sanitizedEnums = Object.fromEntries(
      enumFields.map(field => [field, updateData[field] ?? student[field]])
    );
    sanitizeEnumFields(sanitizedEnums);
    suppliedEnumFields.forEach(field => {
      updateData[field] = sanitizedEnums[field];
    });

    console.log('🔍 Data being sent to database update:', updateData);
    console.log('🔍 Section field in update data:', updateData.section);
    console.log('🔍 Admission class field in update data:', updateData.admission_class);
    console.log('🔍 Current class field in update data:', updateData.current_class);

    // Check for duplicate roll number in the same class-section-stream combination (only if roll number is being updated)
    if (updateData.roll_number && updateData.roll_number !== student.roll_number) {
      const rollNumberWhere = {
        roll_number: updateData.roll_number,
        branch_id: student.branch_id,
        class_id: updateData.class_id || student.class_id,
        section_id: updateData.section_id || student.section_id,
        id: { [Op.ne]: student.id } // Exclude current student
      };

      // Include stream_id in the check if it's being updated or if student has one (only if not null/undefined)
      if (
        updateData.stream_id &&
        updateData.stream_id !== null &&
        updateData.stream_id !== undefined
      ) {
        rollNumberWhere.stream_id = updateData.stream_id;
      } else if (
        student.stream_id &&
        student.stream_id !== null &&
        student.stream_id !== undefined
      ) {
        rollNumberWhere.stream_id = student.stream_id;
      }

      const existingRollNumber = await Student.findOne({
        where: rollNumberWhere
      });

      if (existingRollNumber) {
        const streamName =
          rollNumberWhere.stream_id &&
          rollNumberWhere.stream_id !== null &&
          rollNumberWhere.stream_id !== undefined
            ? `-${rollNumberWhere.stream_id}`
            : '';
        throw new ApiError(
          400,
          `Roll number ${updateData.roll_number} already exists in this class-section${streamName}.`
        );
      }
    }

    try {
      await student.update(updateData);
    } catch (error) {
      // Handle ENUM validation errors specifically
      handleEnumValidationError(error);
    }

    // Log what was actually saved

    console.log('🔍 Student section after update:', student.section);
    console.log('🔍 Student admission class after update:', student.admission_class);
    console.log('🔍 Student current class after update:', student.current_class);

    // Update parent/guardian information if provided
    let guardianUpdates = null;

    // Extract guardian data from nested structure
    if (updates.guardian && typeof updates.guardian === 'object') {
      guardianUpdates = updates.guardian;
    } else if (updates.studentData) {
      try {
        const parsedData = JSON.parse(updates.studentData);
        if (parsedData.guardian && typeof parsedData.guardian === 'object') {
          guardianUpdates = parsedData.guardian;
        }
      } catch (parseError) {
        console.error('❌ Error parsing guardian data:', parseError);
      }
    } else if (updates.student && typeof updates.student === 'object') {
      // For direct object format, guardian data is at the same level
      if (updates.guardian && typeof updates.guardian === 'object') {
        guardianUpdates = updates.guardian;
      }
    }

    if (guardianUpdates) {
      console.log('🔍 Updating guardian information:', guardianUpdates);

      // Get the primary parent for this student
      const studentParent = await StudentParent.findOne({
        where: {
          student_id: student.id,
          is_primary: true
        },
        include: [{ model: Parent, as: 'parent' }]
      });

      if (studentParent && studentParent.parent) {
        const parentUpdateData = {
          // Set guardian information based on relation
          guardian_name: guardianUpdates.name,
          guardian_phone: guardianUpdates.mobile_no,
          guardian_email: guardianUpdates.email,
          guardian_relation: guardianUpdates.relation,
          guardian_occupation: guardianUpdates.occupation,
          guardian_income: guardianUpdates.income,
          guardian_education: guardianUpdates.education,
          address: guardianUpdates.address,
          city: guardianUpdates.city,
          state: guardianUpdates.state,
          emergency_contact: true, // Set to true since this is the emergency contact
          updated_by: req.user.id
        };

        // Set father or mother information based on relation
        if (guardianUpdates.relation === 'father') {
          parentUpdateData.father_name = guardianUpdates.name;
          parentUpdateData.father_phone = guardianUpdates.mobile_no;
          parentUpdateData.father_email = guardianUpdates.email;
          parentUpdateData.father_occupation = guardianUpdates.occupation;
          parentUpdateData.father_qualification = guardianUpdates.education;
          parentUpdateData.father_income = guardianUpdates.income;
        } else if (guardianUpdates.relation === 'mother') {
          parentUpdateData.mother_name = guardianUpdates.name;
          parentUpdateData.mother_phone = guardianUpdates.mobile_no;
          parentUpdateData.mother_email = guardianUpdates.email;
          parentUpdateData.mother_occupation = guardianUpdates.occupation;
          parentUpdateData.mother_qualification = guardianUpdates.education;
          parentUpdateData.mother_income = guardianUpdates.income;
        }

        // Always update both father and mother names if provided
        if (guardianUpdates.father_name) {
          parentUpdateData.father_name = guardianUpdates.father_name;
        }
        if (guardianUpdates.mother_name) {
          parentUpdateData.mother_name = guardianUpdates.mother_name;
        }

        // Update additional guardian fields if provided
        if (guardianUpdates.occupation) {
          if (guardianUpdates.relation === 'father') {
            parentUpdateData.father_occupation = guardianUpdates.occupation;
          } else if (guardianUpdates.relation === 'mother') {
            parentUpdateData.mother_occupation = guardianUpdates.occupation;
          }
        }

        if (guardianUpdates.education) {
          if (guardianUpdates.relation === 'father') {
            parentUpdateData.father_qualification = guardianUpdates.education;
          } else if (guardianUpdates.relation === 'mother') {
            parentUpdateData.mother_qualification = guardianUpdates.education;
          }
        }

        if (guardianUpdates.income) {
          if (guardianUpdates.relation === 'father') {
            parentUpdateData.father_income = guardianUpdates.income;
          } else if (guardianUpdates.relation === 'mother') {
            parentUpdateData.mother_income = guardianUpdates.income;
          }
        }

        console.log('🔍 Guardian updates being applied:', parentUpdateData);
        await studentParent.parent.update(parentUpdateData);
        // Guardian information updated successfully
      } else {
        // No primary parent found for student
      }
    }

    logger.info(
      `Student updated: ${student.first_name} ${student.last_name} (${student.admission_number})`
    );
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    logger.error('Error updating student:', error);
    return next(error);
  }
};

// Get students by class
const getStudentsByClass = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const {
      class_name,
      class_names,
      section,
      academic_year,
      status = 'active',
      fee_structure_id
    } = req.query;

    if (!class_name && !class_names && !fee_structure_id) {
      throw new ApiError(400, 'Class name, class names array, or fee structure ID is required');
    }

    const whereClause = {
      school_id: req.schoolId,
      status
    };

    // Add branch filtering for branch_admin
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = assignedBranchId;
    }
    if (req.user.role === 'teacher') {
      const teacherScope = await getTeacherStudentScope(req, academic_year);
      whereClause.academic_year = teacherScope.year;
      appendStudentCondition(whereClause, teacherScope.where);
    }

    // Handle fee structure ID - fetch students from all applicable classes
    if (fee_structure_id) {
      const feeStructure = await FeeStructure.findByPk(fee_structure_id);

      if (!feeStructure) {
        throw new ApiError(404, 'Fee structure not found');
      }

      // ✅ Normalize applicable classes (array or JSON string)
      let applicableClasses = [];
      if (feeStructure.applicable_classes) {
        if (typeof feeStructure.applicable_classes === 'string') {
          try {
            applicableClasses = JSON.parse(feeStructure.applicable_classes);
          } catch {
            applicableClasses = [];
          }
        } else if (Array.isArray(feeStructure.applicable_classes)) {
          applicableClasses = feeStructure.applicable_classes;
        }
      }

      // ✅ If no array found, fallback to single class_name
      if (!applicableClasses || applicableClasses.length === 0) {
        applicableClasses = [feeStructure.class_name];
      }

      console.log('✅ Final applicableClasses for this fee structure:', applicableClasses);

      // ✅ Always use Op.in (even if 1 class)
      whereClause.current_class = { [Op.in]: applicableClasses };

      // ✅ Academic year fallback
      whereClause.academic_year = academic_year || feeStructure.academic_year;
    }
    // Handle multiple classes if provided directly
    else if (class_names && Array.isArray(JSON.parse(class_names))) {
      const classNames = JSON.parse(class_names);
      whereClause.current_class = {
        [Op.in]: classNames
      };
      logger.info(`Fetching students for multiple classes: ${classNames.join(', ')}`);
    }
    // Handle single class name
    else if (class_name) {
      whereClause.current_class = class_name;
      logger.info(`Fetching students for single class: ${class_name}`);
    }

    if (section) whereClause.section = section;
    if (academic_year) whereClause.academic_year = academic_year;

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary'] }
        }
      ],
      order: [
        ['roll_number', 'ASC'],
        ['first_name', 'ASC']
      ]
    });

    logger.info(`Found ${students.length} students for the specified criteria`);
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    logger.error('Error fetching students by class:', error);
    return next(error);
  }
};

// Get student statistics
const getStudentStats = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const {
      academic_year,
      branch_id,
      class_id,
      section_id,
      stream_id,
      school_id,
      category_id,
      status,
      gender,
      from_date,
      to_date
    } = req.query;

    const whereClause = { status: { [Op.ne]: 'deleted' } };

    // Handle school_id and branch_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin must provide school_id to see students
      if (school_id) {
        whereClause.school_id = school_id;
      } else {
        // If no school_id provided, return empty stats for security
        return res.status(200).json({
          success: true,
          data: {
            total: 0,
            active: 0,
            inactive: 0,
            graduated: 0,
            dropped: 0,
            newThisMonth: 0,
            classCount: 0,
            class_distribution: [],
            gender_distribution: [],
            branch_distribution: []
          }
        });
      }
    } else if (req.user.role === 'admin') {
      // School admin is restricted to their school
      whereClause.school_id = req.schoolId;
    } else if (req.user.role === 'branch_admin') {
      // Branch admin is restricted to their specific branch
      whereClause.school_id = req.schoolId;
      whereClause.branch_id = assignedBranchId;
    } else {
      // Default fallback for other roles
      whereClause.school_id = req.schoolId;
    }

    if (branch_id && req.user.role !== 'branch_admin') whereClause.branch_id = branch_id;

    const summaryWhere = { ...whereClause };
    if (academic_year) whereClause.academic_year = academic_year;

    // Handle class_id and section_id using foreign keys
    if (class_id) {
      whereClause.class_id = class_id;
    }

    if (section_id) {
      whereClause.section_id = section_id;
    }
    if (stream_id) whereClause.stream_id = stream_id;
    if (category_id) whereClause.category_id = category_id;
    if (status && status !== 'deleted') whereClause.status = status;
    if (gender) whereClause.gender = gender;
    if (from_date || to_date) {
      whereClause.admission_date = {};
      if (from_date) whereClause.admission_date[Op.gte] = new Date(from_date);
      if (to_date) whereClause.admission_date[Op.lte] = new Date(to_date);
    }

    const currentAcademicYear =
      academic_year || (await getCurrentAcademicYearForSchool(summaryWhere.school_id)).name;
    const [allTimeTotal, currentSessionTotal, unassignedTotal] = await Promise.all([
      Student.count({ where: summaryWhere }),
      Student.count({
        where: {
          ...summaryWhere,
          status: 'active',
          academic_year: currentAcademicYear,
          class_id: { [Op.not]: null }
        }
      }),
      Student.count({
        where: {
          ...summaryWhere,
          status: 'active',
          [Op.or]: [
            { academic_year: { [Op.ne]: currentAcademicYear } },
            { academic_year: { [Op.is]: null } },
            { class_id: { [Op.is]: null } }
          ]
        }
      })
    ]);

    const totalStudents = await Student.count({
      where: whereClause
    });

    const activeStudents = await Student.count({
      where: { ...whereClause, status: 'active' }
    });

    const inactiveStudents = await Student.count({
      where: { ...whereClause, status: 'inactive' }
    });

    const graduatedStudents = await Student.count({
      where: { ...whereClause, status: 'graduated' }
    });

    const droppedStudents = await Student.count({
      where: { ...whereClause, status: 'dropped' }
    });

    // Get class-wise distribution
    const classDistribution = await Student.findAll({
      where: whereClause,
      attributes: [
        'current_class',
        [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count']
      ],
      group: ['current_class'],
      order: [['current_class', 'ASC']],
      raw: true
    });

    const genderDistribution = await Student.findAll({
      where: whereClause,
      attributes: ['gender', [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count']],
      group: ['gender'],
      raw: true
    });

    // Get branch-wise distribution (only when viewing by school, not by branch)
    let branchDistribution = [];
    if (school_id && !branch_id) {
      branchDistribution = await Student.findAll({
        where: whereClause,
        attributes: [
          'branch_id',
          [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count']
        ],
        group: ['branch_id'],
        order: [['branch_id', 'ASC']],
        raw: true
      });
    }

    // Get new students this month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const newThisMonth = await Student.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: firstDayOfMonth
        }
      }
    });

    // Get class count
    const classCount = await Student.count({
      where: whereClause,
      distinct: true,
      col: 'current_class'
    });

    const stats = {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      graduated: graduatedStudents,
      dropped: droppedStudents,
      newThisMonth: newThisMonth,
      classCount: classCount,
      current_academic_year: currentAcademicYear,
      current_session_total: currentSessionTotal,
      all_time_total: allTimeTotal,
      unassigned_total: unassignedTotal,
      class_distribution: classDistribution,
      gender_distribution: genderDistribution,
      branch_distribution: branchDistribution
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching student statistics:', error);
    return next(error);
  }
};

// Get student report with advanced filtering
const getStudentReport = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const {
      page = 1,
      limit = 10,
      academic_year,
      class_name,
      class_id,
      section_name,
      section_id,
      stream_id,
      category_id,
      status,
      gender,
      search,
      from_date,
      to_date,
      sort_by = 'created_at',
      sort_order = 'DESC',
      school_id,
      branch_id
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on user role
    let whereClause = { status: { [Op.ne]: 'deleted' } };

    // Handle school_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin must provide school_id to see students
      if (school_id) {
        whereClause.school_id = school_id;
      } else {
        // If no school_id provided, return empty report for security
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            current_page: parseInt(page),
            total_pages: 0,
            total_count: 0,
            limit: parseInt(limit)
          }
        });
      }
    } else {
      // School admin and branch admin are restricted to their school
      whereClause.school_id = req.schoolId;
    }
    if (req.user.role === 'branch_admin') whereClause.branch_id = assignedBranchId;
    else if (branch_id) whereClause.branch_id = branch_id;

    // Add filters
    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section_name) whereClause.section = section_name;
    if (class_id) whereClause.class_id = class_id;
    if (section_id) whereClause.section_id = section_id;
    if (stream_id) whereClause.stream_id = stream_id;
    if (category_id) whereClause.category_id = category_id;
    if (status && status !== 'deleted') whereClause.status = status;
    if (gender) whereClause.gender = gender;

    // Add date range filters
    if (from_date || to_date) {
      whereClause.admission_date = {};
      if (from_date) {
        whereClause.admission_date[Op.gte] = new Date(from_date);
      }
      if (to_date) {
        whereClause.admission_date[Op.lte] = new Date(to_date);
      }
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        {
          admission_number: {
            [Op.and]: [{ [Op.not]: null }, { [Op.iLike]: `%${search}%` }]
          }
        },
        {
          email: {
            [Op.and]: [{ [Op.not]: null }, { [Op.iLike]: `%${search}%` }]
          }
        }
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary'] }
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name']
        }
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching student report:', error);
    return next(error);
  }
};

const getStudentRiskRegister = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.schoolId;
    const assignedBranchId = req.user.role === 'branch_admin' ? getAssignedBranchId(req) : null;
    let branchId = assignedBranchId || req.query.branch_id || null;
    const attendanceBelow = Number(req.query.attendance_below ?? 75);
    const overdueDays = Number(req.query.overdue_days ?? 30);
    const minSignals = Number(req.query.min_signals ?? 2);
    const wantsLibraryOut = req.query.library_out === 'true';
    const wantsLibraryOverdue = req.query.library_overdue === 'true';
    const wantsTransport = String(req.query.has_transport) === 'true';
    const wantsHostel = String(req.query.has_hostel) === 'true';

    if (!schoolId) throw new ApiError(400, 'School context is required');
    if (req.user.role === 'branch_admin' && !assignedBranchId) {
      throw new ApiError(403, 'Assigned branch is required');
    }
    if (branchId && !assignedBranchId) {
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(branchId)) {
        throw new ApiError(400, 'Invalid branch ID');
      }
      const branch = await Branch.findOne({
        where: { id: branchId, school_id: schoolId, status: 'active' },
        attributes: ['id']
      });
      if (!branch) throw new ApiError(400, 'Invalid branch for this school');
      branchId = branch.id;
    }
    if (!Number.isFinite(attendanceBelow) || attendanceBelow < 0 || attendanceBelow > 100) {
      throw new ApiError(400, 'attendance_below must be between 0 and 100');
    }
    if (!Number.isInteger(overdueDays) || overdueDays < 1 || overdueDays > 3650) {
      throw new ApiError(400, 'overdue_days must be between 1 and 3650');
    }
    if (!Number.isInteger(minSignals) || minSignals < 1 || minSignals > 3) {
      throw new ApiError(400, 'min_signals must be between 1 and 3');
    }
    for (const value of [req.query.library_out, req.query.library_overdue, req.query.has_transport, req.query.has_hostel]) {
      if (value != null && !['true', 'false'].includes(String(value))) {
        throw new ApiError(400, 'Service filters must be true or false');
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const fromDate = req.query.from_date || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    if (Number.isNaN(Date.parse(fromDate)) || Number.isNaN(Date.parse(today))) {
      throw new ApiError(400, 'from_date must be a valid date');
    }
    const where = {
      school_id: schoolId,
      ...(branchId && { branch_id: branchId }),
      status: 'active',
      ...(req.query.class_id && { class_id: req.query.class_id }),
      ...(req.query.section_id && { section_id: req.query.section_id }),
      ...(req.query.category_id && { category_id: req.query.category_id }),
      ...(req.query.gender && { gender: req.query.gender })
    };
    const membershipFilters = [];
    let filteredLibraryIssues = null;
    if (wantsLibraryOut || wantsLibraryOverdue) {
      filteredLibraryIssues = await LibraryIssue.findAll({
        where: {
          school_id: schoolId,
          ...(branchId && { branch_id: branchId }),
          borrower_type: 'student',
          student_id: { [Op.ne]: null },
          status: { [Op.in]: ['issued', 'overdue'] },
          ...(wantsLibraryOverdue && { due_date: { [Op.lt]: today } })
        },
        attributes: ['student_id', 'due_date', 'status']
      });
      membershipFilters.push(new Set(filteredLibraryIssues.map(issue => issue.student_id)));
    }
    if (wantsTransport || wantsHostel) {
      const [transportMemberships, hostelMemberships] = await Promise.all([
        wantsTransport ? StudentTransport.findAll({
          where: { school_id: schoolId, ...(branchId && { branch_id: branchId }) },
          attributes: ['student_id']
        }) : null,
        wantsHostel ? HostelAllocation.findAll({
          where: { school_id: schoolId, ...(branchId && { branch_id: branchId }) },
          attributes: ['student_id']
        }) : null
      ]);
      if (wantsTransport) membershipFilters.push(new Set(transportMemberships.map(row => row.student_id)));
      if (wantsHostel) membershipFilters.push(new Set(hostelMemberships.map(row => row.student_id)));
    }
    if (membershipFilters.length) {
      const [first, ...rest] = membershipFilters;
      where.id = { [Op.in]: [...first].filter(id => rest.every(ids => ids.has(id))) };
    }
    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${req.query.search}%` } },
        { last_name: { [Op.iLike]: `%${req.query.search}%` } },
        { admission_number: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Section, as: 'sectionInfo', attributes: ['id', 'name'] }
      ],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });

    const studentIds = rows.map(student => student.id);
    const scoped = { school_id: schoolId, student_id: { [Op.in]: studentIds } };
    if (branchId) scoped.branch_id = branchId;
    const [sessions, invoices, transportAssignments, hostelAssignments, examResults, gradingSystem] = studentIds.length
      ? await Promise.all([
          AttendanceSession.findAll({
            where: {
              school_id: schoolId,
              ...(branchId && { branch_id: branchId }),
              class_id: { [Op.in]: [...new Set(rows.map(student => student.class_id))] },
              date: { [Op.gte]: fromDate, [Op.lte]: today },
              status: 'published',
              attendance_type: 'daily'
            },
            attributes: ['id', 'class_id', 'section_id', 'date']
          }),
          FeeInvoice.findAll({
            where: {
              ...scoped,
              due_date: { [Op.lt]: today },
              balance_amount: { [Op.gt]: 0 },
              status: { [Op.notIn]: ['draft', 'cancelled'] }
            },
            attributes: ['student_id', 'balance_amount', 'due_date']
          }),
          StudentTransport.findAll({ where: scoped, attributes: ['student_id'] }),
          HostelAllocation.findAll({ where: scoped, attributes: ['student_id'] }),
          ExamResult.findAll({
            where: scoped,
            attributes: ['student_id', 'percentage', 'grade', 'is_absent', 'updated_at'],
            include: [{
              model: Exam,
              as: 'exam',
              attributes: ['id', 'name', 'publish_status', 'result_status'],
              include: [{
                model: ExamSchedule,
                as: 'schedules',
                attributes: ['class_id', 'section_id', 'exam_date'],
                where: { status: { [Op.ne]: 'cancelled' } },
                required: false
              }]
            }]
          }),
          GradingSystem.findOne({
            where: { school_id: schoolId, is_active: true },
            include: [{
              model: GradeScale,
              as: 'gradeScales',
              attributes: ['min_percentage', 'max_percentage', 'is_passing']
            }]
          })
        ])
      : [[], [], [], [], [], null];

    const pageLibraryIssues = filteredLibraryIssues || (studentIds.length
      ? await LibraryIssue.findAll({
          where: {
            ...scoped,
            borrower_type: 'student',
            status: { [Op.in]: ['issued', 'overdue'] }
          },
          attributes: ['student_id', 'due_date', 'status']
        })
      : []);
    const records = sessions.length
      ? await AttendanceRecord.findAll({
          where: {
            ...scoped,
            session_id: { [Op.in]: sessions.map(session => session.id) }
          },
          attributes: ['student_id', 'session_id', 'status']
        })
      : [];
    const recordByStudentSession = new Map(
      records.map(record => [`${record.student_id}:${record.session_id}`, record.status])
    );
    const feesByStudent = new Map();
    for (const invoice of invoices) {
      const value = feesByStudent.get(invoice.student_id) || { balance: 0, oldestDue: today };
      value.balance += Number(invoice.balance_amount) || 0;
      if (invoice.due_date < value.oldestDue) value.oldestDue = invoice.due_date;
      feesByStudent.set(invoice.student_id, value);
    }
    const transportStudentIds = new Set(transportAssignments.map(assignment => assignment.student_id));
    const hostelStudentIds = new Set(hostelAssignments.map(assignment => assignment.student_id));
    const libraryOutStudentIds = new Set(pageLibraryIssues.map(issue => issue.student_id));
    const libraryOverdueStudentIds = new Set(pageLibraryIssues
      .filter(issue => issue.due_date < today)
      .map(issue => issue.student_id));
    const studentById = new Map(rows.map(student => [student.id, student]));
    const latestResults = new Map();
    for (const result of examResults) {
      const student = studentById.get(result.student_id);
      if (!student) continue;
      const examDate = (result.exam?.schedules || []).reduce((latest, schedule) =>
        (!schedule.class_id || schedule.class_id === student.class_id) &&
        (!schedule.section_id || schedule.section_id === student.section_id) &&
        schedule.exam_date <= today &&
        (!latest || schedule.exam_date > latest)
          ? schedule.exam_date
          : latest, null);
      if (!examDate) continue;
      const current = latestResults.get(result.student_id);
      if (current && (current.exam_date > examDate ||
        (current.exam_date === examDate && String(current.updated_at || '') >= String(result.updated_at || '')))) continue;
      latestResults.set(result.student_id, {
        exam_date: examDate,
        updated_at: result.updated_at,
        result: {
          exam_name: result.exam.name,
          exam_date: examDate,
          percentage: Number(result.percentage),
          grade: result.grade,
          is_absent: result.is_absent,
          is_passed: getExamPassStatus(result.percentage, result.is_absent, gradingSystem),
          published: result.exam.publish_status,
          result_published: result.exam.result_status
        }
      });
    }

    const students = rows.map(student => {
      const studentSessions = new Map();
      for (const session of sessions) {
        if (session.class_id !== student.class_id) continue;
        if (session.section_id && session.section_id !== student.section_id) continue;
        const existing = studentSessions.get(session.date);
        if (!existing || session.section_id) studentSessions.set(session.date, session);
      }
      let attendedDays = 0;
      let markedDays = 0;
      for (const session of studentSessions.values()) {
        const status = recordByStudentSession.get(`${student.id}:${session.id}`);
        if (status === 'excused') continue;
        markedDays += 1;
        if (status === 'present' || status === 'late') attendedDays += 1;
      }
      const attendanceRate = markedDays
        ? Number(((attendedDays / markedDays) * 100).toFixed(2))
        : null;
      const feeSummary = feesByStudent.get(student.id);
      const daysOverdue = feeSummary
        ? Math.floor((Date.parse(today) - Date.parse(feeSummary.oldestDue)) / 86400000)
        : 0;
      const riskSignals = [];
      if (attendanceRate !== null && attendanceRate < attendanceBelow) riskSignals.push('low_attendance');
      if (feeSummary && daysOverdue >= overdueDays) riskSignals.push('fees_overdue');
      if (latestResults.get(student.id)?.result.is_passed === false) riskSignals.push('failed_latest_exam');
      return {
        ...student.toJSON(),
        risk: {
          attendance_rate: attendanceRate,
          attendance_marked_days: markedDays,
          overdue_balance: Number((feeSummary?.balance || 0).toFixed(2)),
          oldest_overdue_days: daysOverdue,
          signals: riskSignals,
          service_memberships: {
            transport: transportStudentIds.has(student.id),
            hostel: hostelStudentIds.has(student.id),
            library_books_out: libraryOutStudentIds.has(student.id),
            library_books_overdue: libraryOverdueStudentIds.has(student.id)
          },
          latest_result: latestResults.get(student.id)?.result || null
        }
      };
    });

    return res.json({
      success: true,
      data: students,
      summary: {
        page_at_risk: students.filter(student => student.risk.signals.length >= minSignals).length,
        low_attendance: students.filter(student => student.risk.signals.includes('low_attendance')).length,
        fees_overdue: students.filter(student => student.risk.signals.includes('fees_overdue')).length,
        failed_latest_exam: students.filter(student => student.risk.signals.includes('failed_latest_exam')).length,
        attendance_period: { from: fromDate, to: today, basis: 'published daily attendance; excused days excluded' },
        risk_thresholds: { attendance_below: attendanceBelow, overdue_days: overdueDays, min_signals: minSignals }
      },
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('Error fetching student risk register:', error);
    return next(error);
  }
};

// Export student report
const exportStudentReport = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const {
      academic_year,
      class_name,
      section_name,
      status,
      gender,
      search,
      school_id,
      branch_id,
      class_id,
      section_id,
      stream_id,
      category_id,
      has_siblings,
      enrollment
    } = req.query;
    const whereClause = { status: { [Op.ne]: 'deleted' } };

    if (req.user.role === 'super_admin') {
      if (!school_id) throw new ApiError(400, 'School ID is required for platform exports');
      whereClause.school_id = school_id;
    } else {
      whereClause.school_id = req.schoolId;
    }

    if (req.user.role === 'branch_admin') whereClause.branch_id = assignedBranchId;
    else if (branch_id) whereClause.branch_id = branch_id;
    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section_name) whereClause.section = section_name;
    if (class_id) whereClause.class_id = class_id;
    if (section_id) whereClause.section_id = section_id;
    if (stream_id) whereClause.stream_id = stream_id;
    if (category_id) whereClause.category_id = category_id;
    if (status && status !== 'deleted') whereClause.status = status;
    if (gender) whereClause.gender = gender;
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { admission_number: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    await applyEnrollmentFilter(whereClause, enrollment, academic_year);
    await applySiblingFilter(whereClause, has_siblings);

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation']
        },
        { model: Class, as: 'class', attributes: ['name'] },
        { model: Section, as: 'sectionInfo', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const safeCell = value => {
      const text = value == null ? '' : String(value);
      return /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
    };
    const rows = students.map(student => {
      const row = student.toJSON();
      const parent = row.parents?.[0] || {};
      return {
        'Admission Number': safeCell(row.admission_number),
        'Roll Number': safeCell(row.roll_number),
        'Student Name': safeCell([row.first_name, row.last_name].filter(Boolean).join(' ')),
        Class: safeCell(row.class?.name || row.current_class),
        Section: safeCell(row.sectionInfo?.name || row.section),
        Status: safeCell(row.status),
        Email: safeCell(row.email),
        Phone: safeCell(row.phone),
        Guardian: safeCell(parent.guardian_name),
        'Guardian Phone': safeCell(parent.guardian_phone),
        'Guardian Email': safeCell(parent.guardian_email)
      };
    });
    return res
      .status(200)
      .type('text/csv; charset=utf-8')
      .attachment('students.csv')
      .send(Papa.unparse(rows));
  } catch (error) {
    logger.error('Error exporting student report:', error);
    return next(error);
  }
};

const buildBulkImportGuardianData = (getValue, schoolId, branchId, userId) => {
  const guardianName = getValue('GuardianName', 'guardianname');
  const guardianPhone = getValue('GuardianMobileNo', 'guardianmobileno');
  const guardianRelation =
    getValue('GuardianRelation', 'guardianrelation')?.toLowerCase() || 'guardian';
  const guardianEmail = getValue('GuardianEmail', 'guardianemail') || null;
  const guardianOccupation = getValue('GuardianOccupation', 'guardianoccupation') || null;
  const guardianEducation = getValue('GuardianEducation', 'guardianeducation') || null;
  const guardianIncome = getValue('GuardianIncome', 'guardianincome') ?? null;
  const guardianData = {
    guardian_name: guardianName ? guardianName.substring(0, 100) : null,
    guardian_phone: guardianPhone ? guardianPhone.substring(0, 20) : null,
    guardian_email: guardianEmail,
    guardian_relation: guardianRelation,
    guardian_occupation: guardianOccupation,
    guardian_income: guardianIncome,
    guardian_education: guardianEducation,
    address: getValue('GuardianAddress', 'guardianaddress') || null,
    city: getValue('City', 'city') || null,
    state: getValue('State', 'state') || null,
    postal_code: getValue('PostalCode', 'postalcode') || null,
    country: getValue('Country', 'country') || 'India',
    emergency_contact: true,
    school_id: schoolId,
    branch_id: branchId,
    created_by: userId,
    updated_by: userId,
    mother_name: getValue('MotherName', 'mothername') || null,
    father_phone: getValue('FatherPhone', 'fatherphone') || null,
    father_email: getValue('FatherEmail', 'fatheremail') || null,
    father_occupation: getValue('FatherOccupation', 'fatheroccupation') || null,
    father_qualification: getValue('FatherQualification', 'fatherqualification') || null,
    father_income: getValue('FatherIncome', 'fatherincome') ?? null,
    mother_phone: getValue('MotherPhone', 'motherphone') || null,
    mother_email: getValue('MotherEmail', 'motheremail') || null,
    mother_occupation: getValue('MotherOccupation', 'motheroccupation') || null,
    mother_qualification: getValue('MotherQualification', 'motherqualification') || null,
    mother_income: getValue('MotherIncome', 'motherincome') ?? null
  };

  if (guardianRelation === 'father') {
    Object.assign(guardianData, {
      father_name: guardianData.guardian_name,
      father_phone: getValue('FatherPhone', 'fatherphone') || guardianData.guardian_phone,
      father_email: getValue('FatherEmail', 'fatheremail') || guardianEmail,
      father_occupation: getValue('FatherOccupation', 'fatheroccupation') || guardianOccupation,
      father_qualification:
        getValue('FatherQualification', 'fatherqualification') || guardianEducation,
      father_income: getValue('FatherIncome', 'fatherincome') ?? guardianIncome
    });
  } else if (guardianRelation === 'mother') {
    Object.assign(guardianData, {
      mother_name: guardianData.guardian_name,
      mother_phone: getValue('MotherPhone', 'motherphone') || guardianData.guardian_phone,
      mother_email: getValue('MotherEmail', 'motheremail') || guardianEmail,
      mother_occupation: getValue('MotherOccupation', 'motheroccupation') || guardianOccupation,
      mother_qualification:
        getValue('MotherQualification', 'motherqualification') || guardianEducation,
      mother_income: getValue('MotherIncome', 'motherincome') ?? guardianIncome
    });
  }

  const fatherName = getValue('FatherName', 'fathername');
  const motherName = getValue('MotherName', 'mothername');
  if (fatherName) guardianData.father_name = fatherName.substring(0, 100);
  if (motherName) guardianData.mother_name = motherName.substring(0, 100);
  return guardianData;
};

// Bulk import students from CSV
const bulkImportStudents = async (req, res, next) => {
  let importBatch = null;
  try {
    if (!req.file) {
      throw new ApiError(400, 'CSV file is required');
    }

    const { class_id, section_id, academic_year_id } = req.body;

    // Determine school_id and branch_id based on user role
    let school_id;
    if (req.user.role === 'super_admin') {
      school_id = req.body.school_id;
      if (!school_id) {
        throw new ApiError(400, 'School ID is required for super admin');
      }
    } else {
      school_id = req.user.school_id;
    }

    let branchId = req.body.branch_id;
    if (req.user.role === 'branch_admin') {
      const assignedBranchId = getAssignedBranchId(req);
      if (branchId && branchId !== assignedBranchId) {
        throw new ApiError(403, 'Not authorized to import students into this branch');
      }
      branchId = assignedBranchId;
    }

    if (!branchId || !class_id) {
      throw new ApiError(400, 'Branch and Class are required');
    }
    branchId = await resolveStudentBranch(school_id, branchId);

    // Parse uploads in memory so preview never writes the original file to disk.
    if (!req.file || !req.file.buffer) {
      throw new ApiError(400, 'Student import file is required and must be uploaded properly');
    }

    const filename = req.file.originalname || 'students.csv';
    const isSpreadsheet = /\.(xlsx|xls)$/i.test(filename);
    const hasMapping = Boolean(req.body.column_mapping);
    let dataRows;
    if (req.query?.discover === 'true' || isSpreadsheet || hasMapping) {
      let parsedFile;
      try {
        parsedFile = inspectStudentImport(req.file.buffer, filename);
      } catch (error) {
        throw new ApiError(400, error.message);
      }

      if (req.query?.discover === 'true') {
        return res.status(200).json({
          success: true,
          data: {
            headers: parsedFile.headers,
            header_row: parsedFile.headerRow + 1,
            total_rows: parsedFile.dataRows.length,
            fields: STUDENT_IMPORT_FIELDS
          }
        });
      }

      let mapping;
      try {
        mapping = typeof req.body.column_mapping === 'string'
          ? JSON.parse(req.body.column_mapping)
          : req.body.column_mapping;
        if (!mapping) throw new Error('Upload the file and match its columns before previewing');
        dataRows = mapStudentImportRows(parsedFile.dataRows, mapping);
      } catch (error) {
        throw new ApiError(400, error.message);
      }
    } else {
      const csvContent = req.file.buffer.toString('utf-8');
      if (!csvContent || csvContent.trim().length === 0) {
        throw new ApiError(400, 'CSV file is empty');
      }

      const result = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        dynamicTyping: false,
        delimiter: '',
        newline: '',
        quoteChar: '"',
        escapeChar: '"'
      });

      if (result.errors.length > 0) {
        throw new ApiError(
          400,
          `CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`
        );
      }

      dataRows = result.data;
    }

    if (dataRows.length === 0) {
      throw new ApiError(400, 'Import file must contain at least one data row');
    }

    // Keep the legacy fixed-header CSV contract intact; mapped imports validate required mappings above.
    const requiredColumns = [
      { pascalCase: 'FirstName', lowercase: 'firstname' },
      { pascalCase: 'Gender', lowercase: 'gender' },
      { pascalCase: 'Birthday', lowercase: 'birthday' },
      { pascalCase: 'AdmissionDate', lowercase: 'admissiondate' },
      { pascalCase: 'AdmissionNumber', lowercase: 'admissionnumber' },
      { pascalCase: 'GuardianName', lowercase: 'guardianname' },
      { pascalCase: 'GuardianRelation', lowercase: 'guardianrelation' },
      { pascalCase: 'GuardianMobileNo', lowercase: 'guardianmobileno' },
      { pascalCase: 'GuardianAddress', lowercase: 'guardianaddress' }
    ];

    if (!dataRows[0] || Object.keys(dataRows[0]).length === 0) {
      throw new ApiError(400, 'CSV file must contain valid headers');
    }

    const headers = Object.keys(dataRows[0]);
    const missingColumns = hasMapping ? [] : requiredColumns.filter(
      col => !headers.includes(col.pascalCase) && !headers.includes(col.lowercase)
    );

    if (missingColumns.length > 0) {
      const missingColumnNames = missingColumns.map(col => col.pascalCase);
      throw new ApiError(
        400,
        `Missing required columns: ${missingColumnNames.join(', ')}. Found columns: ${headers.join(', ')}`
      );
    }

    // Get class and section names
    const classRecord = await Class.findOne({
      where: { id: class_id, school_id, branch_id: branchId, is_active: true }
    });
    if (!classRecord) {
      throw new ApiError(400, 'Invalid class ID');
    }

    let sectionRecord = null;
    if (section_id) {
      sectionRecord = await Section.findOne({
        where: {
          id: section_id,
          class_id,
          school_id,
          branch_id: branchId,
          is_active: true
        }
      });
      if (!sectionRecord) {
        throw new ApiError(400, 'Invalid section ID');
      }
    }

    if (req.body.stream_id) {
      const stream = await Stream.findOne({
        where: {
          id: req.body.stream_id,
          class_id,
          school_id,
          branch_id: branchId,
          is_active: true
        }
      });
      if (!stream) throw new ApiError(400, 'Invalid stream for this class and branch');
    }

    // Get academic year name - use provided ID or fallback to current academic year
    let academicYearName;
    if (academic_year_id) {
      const academicYearRecord = await AcademicYear.findByPk(academic_year_id);
      if (academicYearRecord) {
        academicYearName = academicYearRecord.name;
      }
    }

    // Fallback to current academic year if no ID provided or ID not found
    if (!academicYearName) {
      try {
        const currentYear = await getCurrentAcademicYearForSchool(school_id);
        if (currentYear) {
          academicYearName = currentYear.name;
          console.log('🔍 Bulk import: Academic year fallback to current:', academicYearName);
        } else {
          // Last resort: use current year as string
          const currentYearString = new Date().getFullYear().toString();
          academicYearName = `${currentYearString}-${(parseInt(currentYearString) + 1).toString().slice(-2)}`;
          console.log('🔍 Bulk import: Academic year last resort:', academicYearName);
        }
      } catch (error) {
        console.error('❌ Error fetching current academic year for bulk import:', error);
        // Last resort fallback
        const currentYearString = new Date().getFullYear().toString();
        academicYearName = `${currentYearString}-${(parseInt(currentYearString) + 1).toString().slice(-2)}`;
      }
    }

    const previewOnly = req.query?.preview === 'true';
    const previewRows = [];
    const previewAdmissionNumbers = new Set();
    const previewRollNumbers = new Set();
    const results = {
      total: dataRows.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    if (!previewOnly) {
      importBatch = await StudentImportBatch.create({
        school_id,
        branch_id: branchId,
        imported_by: req.user.id,
        file_name: filename.replace(/^.*[\\/]/, '').slice(0, 255) || 'student-import',
        total_rows: results.total,
        status: 'in_progress'
      });
    }

    // Process each row with individual transactions
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];
      if (!rowData || Object.keys(rowData).length === 0) continue;

      const rowTransaction = previewOnly ? null : await sequelize.transaction();

      try {
        // Map category ID to category name
        // Helper function to get value from row data with case-insensitive matching
        const getValue = (pascalCase, lowercase) => {
          return rowData[pascalCase] || rowData[lowercase] || null;
        };

        const rawCategory = getValue('Category', 'category') || getValue('CategoryID', 'categoryid');
        const categoryMapping = {
          '1': 'general', '2': 'obc', '3': 'sc', '4': 'st', '5': 'other',
          general: 'general', gen: 'general', obc: 'obc', sc: 'sc', st: 'st', other: 'other'
        };
        let category = rawCategory
          ? categoryMapping[String(rawCategory).trim().toLowerCase()]
          : 'general';
        let categoryId = null;
        if (rawCategory && !category) {
          const categoryWhere = {
            school_id,
            is_active: true,
            name: { [Op.iLike]: String(rawCategory).trim() }
          };
          const schoolCategoryOptions = { where: { ...categoryWhere, branch_id: null } };
          const branchCategory = await StudentCategory.findOne({
            where: { ...categoryWhere, branch_id: branchId }
          });
          const customCategory =
            branchCategory || (await StudentCategory.findOne(schoolCategoryOptions));
          if (!customCategory) {
            throw new Error(`Unsupported student category "${rawCategory}"`);
          }
          category = 'other';
          categoryId = customCategory.id;
        }
        const suppliedFirstName = getValue('FirstName', 'firstname');
        const fullNameParts = String(getValue('FullName', 'fullname') || '').trim().split(/\s+/).filter(Boolean);
        const firstName = suppliedFirstName || fullNameParts[0] || null;
        const lastName = getValue('LastName', 'lastname') ||
          (!suppliedFirstName && fullNameParts.length > 1 ? fullNameParts[fullNameParts.length - 1] : null);
        const middleName = getValue('MiddleName', 'middlename') ||
          (!suppliedFirstName && fullNameParts.length > 2 ? fullNameParts.slice(1, -1).join(' ') : null);

        // Validate and transform data
        const studentData = {
          first_name: firstName ? firstName.substring(0, 50) : null,
          middle_name: middleName ? middleName.substring(0, 50) : null,
          last_name: lastName ? lastName.substring(0, 50) : null,
          gender: getValue('Gender', 'gender')?.toLowerCase(),
          date_of_birth: getValue('Birthday', 'birthday'),
          admission_date: getValue('AdmissionDate', 'admissiondate'),
          roll_number: getValue('Roll', 'roll') || null,
          admission_number:
            getValue('AdmissionNumber', 'admissionnumber') || `TEMP_${Date.now()}_${i}`,
          blood_group: getValue('BloodGroup', 'bloodgroup') || null,
          mother_tongue: getValue('MotherTongue', 'mothertongue') || null, // Always mapped
          religion: getValue('Religion', 'religion') || null, // Always mapped
          caste: getValue('Caste', 'caste') || null, // Always mapped
          aadhaar_number: getValue('AadhaarNumber', 'aadhaarnumber') || null, // Always mapped
          address: getValue('Address', 'address') || null, // Always mapped
          postal_code: getValue('PostalCode', 'postalcode') || null,
          country: getValue('Country', 'country') || 'India',
          nationality: getValue('Nationality', 'nationality') || 'Indian',
          phone: getValue('Phone', 'phone') ? getValue('Phone', 'phone').substring(0, 20) : null,
          emergency_contact: getValue('EmergencyContact', 'emergencycontact') || null,
          city: getValue('City', 'city') || null,
          state: getValue('State', 'state') || null,
          present_address: getValue('PresentAddress', 'presentaddress') || null,
          permanent_address: getValue('PermanentAddress', 'permanentaddress') || null,
          category: category,
          category_id: categoryId,
          email: getValue('StudentEmail', 'studentemail') || null,
          // Junior college specific fields
          admission_sought_in: getValue('Stream', 'stream')?.toLowerCase() || null, // arts, commerce, science
          previous_exam_details: (() => {
            try {
              const prevExams = getValue('PreviousExams', 'previousexams');
              return prevExams ? JSON.parse(prevExams) : [];
            } catch (parseError) {
              return [];
            }
          })(),
          medical_info: Object.fromEntries(
            [
              ['place_of_birth', getValue('PlaceOfBirth', 'placeofbirth')],
              ['height', getValue('Height', 'height')],
              ['weight', getValue('Weight', 'weight')],
              ['medical_history', getValue('MedicalHistory', 'medicalhistory')]
            ].filter(([, value]) => value)
          ),
          documents: {
            admission_extras: Object.fromEntries(
              [
                ['house', getValue('House', 'house')],
                ['pen', getValue('PEN', 'pen')],
                ['apaar_id', getValue('APAARID', 'apaarid')],
                ['sr_no', getValue('SRNo', 'srno')],
                ['previous_software_id', getValue('PreviousSoftwareID', 'previoussoftwareid')]
              ].filter(([, value]) => value)
            )
          },
          school_id,
          branch_id: branchId,
          class_id,
          section_id: section_id || null,
          stream_id: req.body.stream_id || null, // Add stream_id from request body
          admission_class: classRecord.name,
          current_class: classRecord.name,
          section: sectionRecord ? sectionRecord.name : null,
          academic_year: academicYearName,
          status: 'active',
          created_by: req.user.id,
          updated_by: req.user.id
        };

        // Validate student required fields with strict checking
        const studentRequiredFields = [
          { field: 'FirstName', value: firstName, name: 'First Name' },
          { field: 'Gender', value: getValue('Gender', 'gender'), name: 'Gender' },
          { field: 'Birthday', value: getValue('Birthday', 'birthday'), name: 'Date of Birth' },
          {
            field: 'AdmissionDate',
            value: getValue('AdmissionDate', 'admissiondate'),
            name: 'Admission Date'
          },
          {
            field: 'AdmissionNumber',
            value: getValue('AdmissionNumber', 'admissionnumber'),
            name: 'Admission Number'
          }
        ];

        const missingStudentFields = studentRequiredFields
          .filter(field => !field.value || String(field.value).trim() === '')
          .map(field => field.name);

        if (missingStudentFields.length > 0) {
          throw new Error(`Missing required student fields: ${missingStudentFields.join(', ')}`);
        }

        // Validate field lengths
        const firstNameValue = firstName;
        const lastNameValue = lastName;
        const phone = getValue('Phone', 'phone');

        if (firstNameValue && firstNameValue.length > 50) {
          throw new Error(
            `First name too long (${firstNameValue.length} chars, max 50): ${firstNameValue.substring(0, 30)}...`
          );
        }
        if (lastNameValue && lastNameValue.length > 50) {
          throw new Error(
            `Last name too long (${lastNameValue.length} chars, max 50): ${lastNameValue.substring(0, 30)}...`
          );
        }
        if (phone && phone.length > 20) {
          throw new Error(`Phone number too long (${phone.length} chars, max 20): ${phone}`);
        }

        // Validate guardian required fields with strict checking
        const guardianRequiredFields = [
          {
            field: 'GuardianName',
            value: getValue('GuardianName', 'guardianname'),
            name: 'Guardian Name'
          },
          {
            field: 'GuardianRelation',
            value: getValue('GuardianRelation', 'guardianrelation'),
            name: 'Guardian Relation'
          },
          {
            field: 'GuardianMobileNo',
            value: getValue('GuardianMobileNo', 'guardianmobileno'),
            name: 'Guardian Mobile No'
          },
          {
            field: 'GuardianAddress',
            value: getValue('GuardianAddress', 'guardianaddress'),
            name: 'Guardian Address'
          }
        ];

        const missingGuardianFields = guardianRequiredFields
          .filter(field => !field.value || String(field.value).trim() === '')
          .map(field => field.name);

        if (missingGuardianFields.length > 0) {
          throw new Error(`Missing required guardian fields: ${missingGuardianFields.join(', ')}`);
        }

        // Validate gender format
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(studentData.gender)) {
          throw new Error(
            `Invalid gender "${studentData.gender}". Must be one of: ${validGenders.join(', ')}`
          );
        }

        if (previewOnly && previewAdmissionNumbers.has(studentData.admission_number)) {
          throw new Error(
            `Admission number ${studentData.admission_number} is duplicated in this file`
          );
        }

        // Check for duplicate admission number
        const existingStudent = await Student.findOne({
          where: {
            admission_number: studentData.admission_number,
            school_id: school_id
          },
          transaction: rowTransaction
        });

        if (existingStudent) {
          throw new Error(
            `Student with admission number ${studentData.admission_number} already exists`
          );
        }

        const rollKey = [
          branchId,
          class_id,
          section_id || '',
          req.body.stream_id || '',
          studentData.roll_number || ''
        ].join('|');

        // Check for duplicate roll number in the same class-section-stream combination
        if (studentData.roll_number) {
          const rollNumberWhere = {
            roll_number: studentData.roll_number,
            branch_id: branchId,
            class_id: class_id
          };

          // Only include section_id in the query if it's provided
          if (section_id) {
            rollNumberWhere.section_id = section_id;
          }

          if (previewOnly && previewRollNumbers.has(rollKey)) {
            throw new Error(`Roll number ${studentData.roll_number} is duplicated in this file`);
          }

          // Include stream_id in the check if it's provided (only if not null/undefined)
          if (
            req.body.stream_id &&
            req.body.stream_id !== null &&
            req.body.stream_id !== undefined
          ) {
            rollNumberWhere.stream_id = req.body.stream_id;
          }

          const existingRollNumber = await Student.findOne({
            where: rollNumberWhere,
            transaction: rowTransaction
          });

          if (existingRollNumber) {
            const sectionName = sectionRecord ? sectionRecord.name : 'No Section';
            const streamName =
              req.body.stream_id && req.body.stream_id !== null && req.body.stream_id !== undefined
                ? `-${req.body.stream_id}`
                : '';
            throw new Error(
              `Roll number ${studentData.roll_number} already exists in ${classRecord.name}-${sectionName}${streamName}`
            );
          }
        }

        if (previewOnly) {
          const guardianData = buildBulkImportGuardianData(
            getValue,
            school_id,
            branchId,
            req.user.id
          );
          const existingParent = await Parent.findOne({
            where: {
              guardian_phone: guardianData.guardian_phone,
              school_id,
              branch_id: branchId
            }
          });
          await Student.build(studentData).validate();
          await Student.validateSubscriptionCapacity(school_id, results.successful);
          if (!existingParent) await Parent.build(guardianData).validate();

          previewAdmissionNumbers.add(studentData.admission_number);
          if (studentData.roll_number) previewRollNumbers.add(rollKey);
          previewRows.push({
            row: i + 1,
            admission_number: studentData.admission_number,
            student_name: [studentData.first_name, studentData.last_name]
              .filter(Boolean)
              .join(' '),
            class: classRecord.name,
            section: sectionRecord?.name || null
          });
          results.successful++;
          continue;
        }

        // Create student
        const student = await Student.create(studentData, {
          transaction: rowTransaction
        });
        const guardianData = buildBulkImportGuardianData(
          getValue,
          school_id,
          branchId,
          req.user.id
        );
        const existingParent = await Parent.findOne({
          where: {
            guardian_phone: guardianData.guardian_phone,
            school_id,
            branch_id: branchId
          },
          transaction: rowTransaction
        });
        const guardian =
          existingParent || (await Parent.create(guardianData, { transaction: rowTransaction }));
        const studentParent = await StudentParent.create(
          {
            student_id: student.id,
            parent_id: guardian.id,
            relationship: guardianData.guardian_relation,
            is_primary: true,
            is_emergency_contact: true
          },
          { transaction: rowTransaction }
        );
        await StudentImportBatchRow.create(
          {
            batch_id: importBatch.id,
            student_id: student.id,
            student_parent_id: studentParent.id,
            parent_id: guardian.id,
            parent_created: !existingParent
          },
          { transaction: rowTransaction }
        );

        // Commit the row transaction
        await rowTransaction.commit();
        results.successful++;
      } catch (error) {
        // Rollback the row transaction
        try {
          if (rowTransaction) await rowTransaction.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }

        results.failed++;
        results.errors.push({
          row: i + 1, // +1 because of 0-based index
          error: error.message,
          ...(!previewOnly && { data: rowData })
        });
      }
    }

    let historySaved;
    if (importBatch) {
      try {
        await importBatch.update({
          status: results.successful === 0 ? 'failed' : results.failed ? 'partial' : 'completed',
          successful_rows: results.successful,
          failed_rows: results.failed,
          row_errors: results.errors.slice(0, 500).map(({ row, error }) => ({ row, error })),
          completed_at: new Date(),
          undo_ready: results.successful > 0
        });
        historySaved = true;
      } catch (error) {
        logger.error('Could not save student import history summary:', error);
        historySaved = false;
      }
    }

    const responseData = previewOnly ? { ...results, previewRows } : results;
    const responseMessage = previewOnly
      ? `Preview complete. ${results.successful} students are ready to import, ${results.failed} rows need correction. No records were created.`
      : `Import completed. ${results.successful} students imported successfully, ${results.failed} failed.`;

    res.status(200).json({
      success: true,
      ...(previewOnly && { previewOnly: true }),
      ...(!previewOnly && { history_saved: historySaved }),
      data: responseData,
      message: responseMessage
    });
  } catch (error) {
    if (importBatch) {
      try {
        await importBatch.update({ status: 'interrupted', completed_at: new Date() });
      } catch (historyError) {
        logger.error('Could not mark student import history as interrupted:', historyError);
      }
    }
    logger.error('Error in bulk import:', error);
    return next(error);
  }
};

const getStudentImportHistory = async (req, res, next) => {
  try {
    const schoolId =
      req.user.role === 'super_admin'
        ? req.query.school_id || req.schoolId
        : req.schoolId || req.user.school_id;
    if (!schoolId) throw new ApiError(400, 'School ID is required');

    const where = { school_id: schoolId };
    if (req.user.role === 'branch_admin') {
      const assignedBranchId = getAssignedBranchId(req);
      if (req.query.branch_id && req.query.branch_id !== assignedBranchId) {
        throw new ApiError(403, 'Not authorized to view import history for this branch');
      }
      where.branch_id = assignedBranchId;
    } else if (req.query.branch_id) {
      const branch = await Branch.findOne({
        where: { id: req.query.branch_id, school_id: schoolId, status: 'active' }
      });
      if (!branch) throw new ApiError(400, 'Invalid branch for this school');
      where.branch_id = branch.id;
    }

    const batches = await StudentImportBatch.findAll({
      where,
      attributes: [
        'id',
        'branch_id',
        'imported_by',
        'file_name',
        'status',
        'total_rows',
        'successful_rows',
        'failed_rows',
        'row_errors',
        'created_at',
        'completed_at',
        'undo_ready',
        'undone_at',
        'undo_details'
      ],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    return res.status(200).json({ success: true, data: batches });
  } catch (error) {
    return next(error);
  }
};

const assertStudentImportHasNoDependents = async (studentIds, transaction) => {
  const studentWhere = { student_id: { [Op.in]: studentIds } };
  const dependencies = [
    [GatePass, studentWhere, 'gate passes'],
    [ParentTeacherMeetingStudent, studentWhere, 'parent-teacher meetings'],
    [AttendanceRecord, studentWhere, 'attendance records'],
    [ExamPosition, studentWhere, 'exam positions'],
    [ExamResult, studentWhere, 'exam results'],
    [HomeworkSubmission, studentWhere, 'homework submissions'],
    [LibraryIssue, studentWhere, 'library issues'],
    [OnlineExamAttempt, studentWhere, 'online exam attempts'],
    [StudentPromotion, studentWhere, 'promotion records'],
    [FeeInvoice, studentWhere, 'fee invoices'],
    [FeePayment, studentWhere, 'fee payments'],
    [HostelAllocation, studentWhere, 'hostel allocations'],
    [StudentTransport, studentWhere, 'transport assignments'],
    [Alumni, studentWhere, 'alumni records'],
    [DynamicEntityRecord, studentWhere, 'dynamic school records']
  ];

  for (const [Model, where, label] of dependencies) {
    const dependent = await Model.findOne({
      where,
      attributes: ['id'],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (dependent) {
      throw new ApiError(409, `Undo blocked: imported students have ${label}.`);
    }
  }
};

const undoStudentImportBatch = async (req, res, next) => {
  try {
    const schoolId =
      req.user.role === 'super_admin'
        ? req.body.school_id || req.query.school_id || req.schoolId
        : req.schoolId || req.user.school_id;
    if (!schoolId) throw new ApiError(400, 'School ID is required');

    const result = await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async transaction => {
        const where = { id: req.params.id, school_id: schoolId };
        if (req.user.role === 'branch_admin') {
          const assignedBranchId = getAssignedBranchId(req);
          if (req.body.branch_id && req.body.branch_id !== assignedBranchId) {
            throw new ApiError(403, 'Not authorized to undo imports for this branch');
          }
          where.branch_id = assignedBranchId;
        }

        const batch = await StudentImportBatch.findOne({
          where,
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!batch) throw new ApiError(404, 'Student import batch not found');
        if (batch.undone_at || batch.status === 'undone') {
          throw new ApiError(409, 'This student import was already undone');
        }
        if (!['completed', 'partial'].includes(batch.status) || !batch.undo_ready) {
          throw new ApiError(409, 'This import does not have complete undo ownership records');
        }

        const batchRows = await StudentImportBatchRow.findAll({
          where: { batch_id: batch.id },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!batchRows.length || batchRows.length !== batch.successful_rows) {
          throw new ApiError(409, 'Import ownership records are incomplete; no records were changed');
        }
        const studentIds = batchRows.map(row => row.student_id);
        const studentParentIds = batchRows.map(row => row.student_parent_id);
        if (
          studentIds.some(id => !id) ||
          studentParentIds.some(id => !id) ||
          new Set(studentIds).size !== studentIds.length ||
          new Set(studentParentIds).size !== studentParentIds.length
        ) {
          throw new ApiError(409, 'Import records changed after the run; no records were changed');
        }

        const students = await Student.findAll({
          where: {
            id: { [Op.in]: studentIds },
            school_id: batch.school_id,
            branch_id: batch.branch_id
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (students.length !== studentIds.length) {
          throw new ApiError(409, 'Some imported students moved or no longer exist; no records were changed');
        }
        if (students.some(student => new Date(student.updated_at).getTime() > new Date(student.created_at).getTime())) {
          throw new ApiError(409, 'Imported students were edited after the import; no records were changed');
        }

        const currentLinks = await StudentParent.findAll({
          where: { student_id: { [Op.in]: studentIds } },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        const expectedLinkIds = new Set(studentParentIds);
        if (
          currentLinks.length !== studentParentIds.length ||
          currentLinks.some(
            link =>
              !expectedLinkIds.has(link.id) ||
              new Date(link.updated_at).getTime() > new Date(link.created_at).getTime()
          )
        ) {
          throw new ApiError(409, 'Student-parent links changed after the import; no records were changed');
        }

        await assertStudentImportHasNoDependents(studentIds, transaction);

        const createdParentIds = [
          ...new Set(batchRows.filter(row => row.parent_created && row.parent_id).map(row => row.parent_id))
        ];
        const createdParents = createdParentIds.length
          ? await Parent.findAll({
              where: { id: { [Op.in]: createdParentIds }, school_id: batch.school_id },
              transaction,
              lock: transaction.LOCK.UPDATE
            })
          : [];

        await StudentParent.destroy({
          where: { id: { [Op.in]: studentParentIds }, student_id: { [Op.in]: studentIds } },
          transaction
        });
        await Student.destroy({
          where: {
            id: { [Op.in]: studentIds },
            school_id: batch.school_id,
            branch_id: batch.branch_id
          },
          transaction
        });

        const remainingParentLinks = createdParentIds.length
          ? await StudentParent.findAll({
              where: { parent_id: { [Op.in]: createdParentIds } },
              attributes: ['parent_id'],
              transaction,
              lock: transaction.LOCK.UPDATE
            })
          : [];
        const inUseParentIds = new Set(remainingParentLinks.map(link => link.parent_id));
        const removableParentIds = createdParents
          .filter(parent => {
            const changed = new Date(parent.updated_at).getTime() > new Date(parent.created_at).getTime();
            return !parent.user_id && !changed && !inUseParentIds.has(parent.id);
          })
          .map(parent => parent.id);
        if (removableParentIds.length) {
          await Parent.destroy({
            where: {
              id: { [Op.in]: removableParentIds },
              school_id: batch.school_id,
              user_id: null
            },
            transaction
          });
        }

        await batch.update(
          {
            status: 'undone',
            undo_ready: false,
            undone_at: new Date(),
            undone_by: req.user.id,
            undo_details: {
              students_removed: students.length,
              parents_removed: removableParentIds.length,
              parents_preserved: createdParents.length - removableParentIds.length
            }
          },
          { transaction }
        );
        return {
          students_removed: students.length,
          parents_removed: removableParentIds.length,
          parents_preserved: createdParents.length - removableParentIds.length
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: { batch_id: req.params.id, ...result },
      message: `Import undone. ${result.students_removed} students removed; ${result.parents_preserved} shared or updated parent records preserved.`
    });
  } catch (error) {
    return next(error);
  }
};

// Get student invoice breakdown for accordion details
const getStudentInvoiceBreakdown = async (req, res, next) => {
  try {
    const assignedBranchId = getAssignedBranchId(req);
    const { id: studentId } = req.params;
    const { academic_year, status, payment_model } = req.query;

    // Get student
    const student = await Student.findOne({
      where: {
        id: studentId,
        school_id: req.schoolId,
        ...(['branch_admin', 'accountant'].includes(req.user.role) &&
          (assignedBranchId || req.user.branch_id) && {
            branch_id: assignedBranchId || req.user.branch_id
          })
      },
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Build invoice filter
    const invoiceWhereClause = {
      student_id: studentId,
      school_id: req.schoolId
    };

    if (academic_year && academic_year.trim() !== '') {
      invoiceWhereClause.academic_year = academic_year;
    }
    if (status && status.trim() !== '') {
      invoiceWhereClause.status = status;
    }
    if (payment_model && payment_model.trim() !== '') {
      invoiceWhereClause.payment_model = payment_model;
    }

    // Get all invoices for this student
    const invoices = await FeeInvoice.findAll({
      where: invoiceWhereClause,
      include: [
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType'
            }
          ]
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Group invoices by receipt_number for paid/partial_paid invoices
    const groupedInvoices = {};
    const ungroupedInvoices = [];

    invoices.forEach(invoice => {
      // Only group invoices that have a receipt_number AND are paid/partial_paid
      if (invoice.receipt_number && ['paid', 'partial_paid'].includes(invoice.status)) {
        if (!groupedInvoices[invoice.receipt_number]) {
          groupedInvoices[invoice.receipt_number] = {
            receipt_number: invoice.receipt_number,
            invoices: [],
            total_amount: 0,
            total_paid: 0,
            total_balance: 0,
            payment_date: invoice.last_payment_date,
            payment_method: invoice.payment_method,
            transaction_id: invoice.transaction_id,
            status: invoice.status
          };
        }
        groupedInvoices[invoice.receipt_number].invoices.push(invoice);
        groupedInvoices[invoice.receipt_number].total_amount += parseFloat(
          invoice.total_amount || 0
        );
        groupedInvoices[invoice.receipt_number].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_number].total_balance += parseFloat(
          invoice.balance_amount || 0
        );
      } else {
        // All other invoices (including paid invoices without receipt_number) go to ungrouped
        ungroupedInvoices.push(invoice);
      }
    });

    // After grouping, move single-invoice groups back to ungrouped
    Object.keys(groupedInvoices).forEach(receiptNumber => {
      const group = groupedInvoices[receiptNumber];
      if (group.invoices.length === 1) {
        // Single invoice with receipt_number should be ungrouped
        ungroupedInvoices.push(group.invoices[0]);
        delete groupedInvoices[receiptNumber];
      }
    });

    // Helper function to get month name
    const getMonthName = month => {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      return months[month - 1] || month;
    };

    // Convert grouped invoices to array format
    const groupedArray = Object.values(groupedInvoices).map(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];

      const monthNames = group.invoices
        .map(inv => {
          const monthName = getMonthName(inv.month);
          return `${monthName} ${inv.year}`;
        })
        .join(', ');

      // Get branch information from the first invoice that has branch data
      let branchData = null;
      for (const invoice of group.invoices) {
        if (invoice.branch) {
          branchData = invoice.branch;
          break;
        }
      }

      // If no branch data found in invoices, use student's branch as fallback
      if (!branchData && student.branch) {
        branchData = student.branch;
      }

      return {
        id: group.receipt_number,
        receipt_number: group.receipt_number,
        invoice_number: group.invoices.map(inv => inv.invoice_number).join(', '), // Show actual invoice numbers
        fee_type: group.invoices[0]?.feeStructure?.feeType?.name || 'Unknown',
        class_name: group.invoices[0]?.class_name,
        section: group.invoices[0]?.section,
        total_amount: group.total_amount,
        paid_amount: group.total_paid,
        balance_amount: group.total_balance,
        due_date: group.invoices[0]?.due_date,
        status: group.total_balance <= 0 ? 'paid' : 'partial_paid',
        academic_year: group.invoices[0]?.academic_year,
        month: months[0],
        year: years[0],
        months_covered: group.invoices.length,
        month_names: monthNames,

        payment_date: group.payment_date,
        payment_method: group.payment_method,
        transaction_id: group.transaction_id,
        payment_model: group.invoices[0]?.payment_model,
        branch: branchData,
        is_grouped: true
      };
    });

    // Sort by payment date (newest first)
    groupedArray.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    // Calculate paid count correctly - count individual invoices with status = 'paid'
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const pendingCount = invoices.filter(inv => inv.status === 'sent').length;
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
    const partialCount = invoices.filter(inv => inv.status === 'partial_paid').length;

    // Add month information to ungrouped invoices for debugging
    ungroupedInvoices.forEach(invoice => {
      if (invoice.month && invoice.year) {
        const monthName = getMonthName(invoice.month);
        invoice.month_display = `${monthName} ${invoice.year}`;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          current_class: student.current_class,
          section: student.section,
          branch: student.branch
        },
        grouped_invoices: groupedArray,
        ungrouped_invoices: ungroupedInvoices,
        summary: {
          total_invoices: invoices.length,
          total_grouped: groupedArray.length,
          total_ungrouped: ungroupedInvoices.length,
          total_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
          total_paid: invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0),
          total_balance: invoices.reduce(
            (sum, inv) => sum + parseFloat(inv.balance_amount || 0),
            0
          ),
          paid_count: paidCount,
          pending_count: pendingCount,
          overdue_count: overdueCount,
          partial_count: partialCount
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching student invoice breakdown:', error);
    return next(error);
  }
};

module.exports = {
  createStudent,
  resolveStudentAcademicPlacement,
  getStudents,
  getStudentById,
  updateStudent,
  getStudentsByClass,
  getStudentStats,
  getStudentReport,
  getStudentRiskRegister,
  exportStudentReport,
  bulkImportStudents,
  getStudentImportHistory,
  undoStudentImportBatch,
  getStudentInvoiceBreakdown,
  setStudentAuthentication
};
