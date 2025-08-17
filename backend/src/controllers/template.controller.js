const ExcelJS = require('exceljs');
const httpStatus = require('http-status');
const { logger } = require('../utils/logger');

// Generate Excel template for attendance bulk import
const generateAttendanceTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const worksheet = workbook.addWorksheet('Attendance Data');
    
    // Headers - Admin-friendly column names
    const headers = ['Date', 'Class', 'Section', 'AdmissionNo', 'Status', 'Type', 'PeriodNumber'];
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Sample data with realistic admin-friendly values
    const sampleData = [
      ['2025-08-11', 'Class 11', 'A', '3492', 'present', 'daily', ''],
      ['2025-08-11', 'Class 11', 'A', '12C01', 'absent', 'daily', ''],
      ['2025-08-11', 'Class 11', 'B', '3447', 'late', 'daily', ''],
      ['2025-08-11', 'Grade 10', 'Science', '3494', 'present', 'daily', ''],
      ['2025-08-11', 'Grade 10', 'Arts', '3459', 'excused', 'daily', ''],
      ['2025-08-11', 'Class 12', 'A', '3465', 'present', 'period', '1'],
      ['2025-08-11', 'Class 12', 'A', '3466', 'present', 'period', '2'],
      ['2025-08-11', 'Class 12', 'B', '3469', 'absent', 'period', '1']
    ];
    
    sampleData.forEach(row => worksheet.addRow(row));
    
    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });
    
    // Instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Attendance Bulk Import Template Instructions'],
      [''],
      ['✓ Use class names, section names, and admission numbers - NO technical IDs needed!'],
      [''],
      ['Required Columns:'],
      ['• Date - Format: YYYY-MM-DD (e.g., 2025-08-11)'],
      ['• Class - Use class name as it appears in your system (e.g., "Class 11", "Grade 10", "10th Standard")'],
      ['• AdmissionNo - Student admission number (e.g., "3492", "12C01")'],  
      ['• Status - One of: present, absent, late, excused'],
      [''],
      ['Optional Columns:'],
      ['• Section - Section name as it appears in your system (e.g., "A", "B", "Science", "Arts")'],
      ['• Type - daily (default) or period'],
      ['• PeriodNumber - Required if Type is "period" (1, 2, 3, etc.)'],
      [''],
      ['Alternative Column Names (also supported):'],
      ['• Class: You can also use "ClassName" or "ClassId" columns'],
      ['• Section: You can also use "SectionName" or "SectionId" columns'], 
      ['• Student: You can also use "StudentName", "StudentId", or "AdmissionNumber" columns'],
      [''],
      ['How to use this template:'],
      ['1. Replace sample data with your actual class names (no need to look up IDs!)'],
      ['2. Use admission numbers your staff already know'],
      ['3. Use section names as they appear in your Academic → Sections'],
      ['4. The system will automatically find the corresponding records'],
      [''],
      ['Sample Data Explanation:'],
      ['The sample shows realistic data that school admins would actually use:'],
      ['• "Class 11" instead of database UUID'],
      ['• "3492" admission number instead of student UUID'],
      ['• "A" or "Science" for section names'],
      [''],
      ['Status Options:'],
      ['• present - Student was present'],
      ['• absent - Student was absent'],
      ['• late - Student arrived late'],
      ['• excused - Student had excused absence'],
      [''],
      ['Error Handling:'],
      ['• If a class name is not found, you will get a specific error message'],
      ['• If an admission number doesn\'t exist, the import will skip that row'],
      ['• Check the import results for detailed error information'],
      [''],
      ['Tips:'],
      ['• Delete the sample rows and add your actual student data'],
      ['• Make sure class and section names exactly match your system'],
      ['• Each row = one student\'s attendance for one day/period'],
      ['• You can mix daily and period-based attendance in the same file']
    ];
    
    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow([instruction[0]]);
      if (index === 0) {
        row.font = { bold: true, size: 14 };
      } else if (instruction[0] && (instruction[0].includes('Required') || instruction[0].includes('Optional') || instruction[0].includes('How to') || instruction[0].includes('Sample Data') || instruction[0].includes('Status Options') || instruction[0].includes('Tips'))) {
        row.font = { bold: true };
      }
    });
    
    // Auto-fit instruction columns
    instructionsSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 80 ? 80 : maxLength + 2;
    });
    
    // Set response headers for Excel download
    const filename = `attendance-import-template-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write Excel file to response
    await workbook.xlsx.write(res);
    res.end();
    
    logger.info('Attendance template generated successfully');
  } catch (error) {
    logger.error('Error generating attendance template:', error);
    return next(error);
  }
};

// Generate CSV template for student bulk import - Required fields only
const generateStudentTemplateRequired = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const worksheet = workbook.addWorksheet('Student Data - Required');
    
    // Required headers for minimal student import
    const headers = [
      'FirstName', 'Gender', 'DateOfBirth', 'AdmissionDate', 
      'AdmissionNumber', 'CurrentClass', 'GuardianName', 
      'GuardianRelation', 'GuardianMobileNo', 'GuardianAddress'
    ];
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Sample data with required fields only
    const sampleData = [
      ['John', 'male', '2005-06-15', '2023-06-01', '2023001', 'Class 11', 'John Doe Sr', 'father', '9876543210', '123 Main St, Mumbai'],
      ['Sarah', 'female', '2006-03-20', '2023-06-01', '2023002', 'Class 10', 'Sarah Smith Sr', 'father', '9876543211', '456 Park Avenue, Delhi'],
      ['Michael', 'male', '2007-01-10', '2023-06-01', '2023003', 'Class 9', 'Mike Johnson', 'guardian', '9876543212', '789 Oak Street, Bangalore']
    ];
    
    sampleData.forEach(row => worksheet.addRow(row));
    
    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 15 ? 15 : maxLength + 2;
    });
    
    // Instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Student Import Template - Required Fields Only'],
      [''],
      ['This template includes only the essential fields needed for basic student registration.'],
      [''],
      ['Required Fields:'],
      ['• FirstName - Student\'s first name (Required)'],
      ['• Gender - male/female/other (Required)'],
      ['• DateOfBirth - Format: YYYY-MM-DD (Required)'],
      ['• AdmissionDate - Format: YYYY-MM-DD (Required)'],
      ['• AdmissionNumber - Unique student ID (Required)'],
      ['• CurrentClass - Class name like "Class 11", "Grade 10" (Required)'],
      ['• GuardianName - Primary guardian\'s name (Required)'],
      ['• GuardianRelation - father/mother/guardian (Required)'],
      ['• GuardianMobileNo - Contact number (Required)'],
      ['• GuardianAddress - Full address (Required)'],
      [''],
      ['Important Notes:'],
      ['• Use class names as they appear in your system'],
      ['• Admission numbers must be unique per school'],
      ['• Date format must be YYYY-MM-DD (e.g., 2005-06-15)'],
      ['• Gender values: male, female, or other'],
      ['• Guardian relation: father, mother, or guardian'],
      [''],
      ['For complete student profiles with all fields, use the "complete" template instead.']
    ];
    
    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow([instruction[0]]);
      if (index === 0) {
        row.font = { bold: true, size: 14 };
      } else if (instruction[0] && (instruction[0].includes('Required') || instruction[0].includes('Important') || instruction[0].includes('For complete'))) {
        row.font = { bold: true };
      }
    });
    
    // Auto-fit instruction columns
    instructionsSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 80 ? 80 : maxLength + 2;
    });
    
    // Set response headers for Excel download
    const filename = `student-import-template-required-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write Excel file to response
    await workbook.xlsx.write(res);
    res.end();
    
    logger.info('Student required template generated successfully');
  } catch (error) {
    logger.error('Error generating student required template:', error);
    return next(error);
  }
};

// Generate comprehensive CSV template for student bulk import - All fields
const generateStudentTemplateComplete = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const worksheet = workbook.addWorksheet('Student Data - Complete');
    
    // Complete headers for comprehensive student import
    const headers = [
      'FirstName', 'LastName', 'MiddleName', 'Gender', 'DateOfBirth', 
      'AdmissionDate', 'AdmissionNumber', 'RollNumber', 'CurrentClass', 'Section',
      'BloodGroup', 'Religion', 'Caste', 'Category', 'Nationality', 'MotherTongue',
      'Email', 'Phone', 'EmergencyContact', 'Address', 'City', 'State', 'PostalCode', 'Country',
      'AadhaarNumber', 'AdmissionSoughtIn', 'PreviousExamDetails', 'Status',
      'FatherName', 'FatherPhone', 'FatherEmail', 'FatherOccupation', 'FatherQualification', 'FatherIncome',
      'MotherName', 'MotherPhone', 'MotherEmail', 'MotherOccupation', 'MotherQualification', 'MotherIncome',
      'GuardianName', 'GuardianPhone', 'GuardianEmail', 'GuardianOccupation', 'GuardianQualification', 
      'GuardianIncome', 'GuardianRelation', 'GuardianAddress'
    ];
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Sample data with complete fields
    const sampleData = [
      [
        'John', 'Doe', 'Kumar', 'male', '2005-06-15', '2023-06-01', '2023001', '101', 'Class 11', 'A',
        'A+', 'Hindu', 'General', 'general', 'Indian', 'Hindi',
        'john.doe@email.com', '9876543210', '9876543211', '123 Main St, Mumbai', 'Mumbai', 'Maharashtra', '400001', 'India',
        '123456789012', 'science', '[{"exam_name":"SSC","institution":"ABC School","percentage":85.5}]', 'active',
        'John Doe Sr', '9876543210', 'john.sr@email.com', 'Engineer', 'B.Tech', '750000',
        'Jane Doe', '9876543211', 'jane.doe@email.com', 'Teacher', 'M.Ed', '450000',
        'John Doe Sr', '9876543210', 'john.sr@email.com', 'Engineer', 'B.Tech', '750000', 'father', '123 Main St, Mumbai'
      ]
    ];
    
    sampleData.forEach(row => worksheet.addRow(row));
    
    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });
    
    // Instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Student Import Template - Complete with All Fields'],
      [''],
      ['This template includes all available fields for comprehensive student profiles.'],
      [''],
      ['Required Fields (marked with *):'],
      ['• FirstName* - Student\'s first name'],
      ['• Gender* - male/female/other'],
      ['• DateOfBirth* - Format: YYYY-MM-DD'],
      ['• AdmissionDate* - Format: YYYY-MM-DD'],
      ['• AdmissionNumber* - Unique student ID'],
      ['• CurrentClass* - Class name like "Class 11", "Grade 10"'],
      ['• GuardianName* - Primary guardian\'s name'],
      ['• GuardianRelation* - father/mother/guardian'],
      [''],
      ['Optional Fields:'],
      ['• LastName, MiddleName - Additional name parts'],
      ['• RollNumber - Class roll number'],
      ['• Section - Section name like "A", "B"'],
      ['• BloodGroup - Blood group (A+, B+, O+, etc.)'],
      ['• Religion, Caste - Religious information'],
      ['• Category - general/obc/sc/st/other'],
      ['• Contact Info - Email, Phone, EmergencyContact'],
      ['• Address Details - Address, City, State, PostalCode, Country'],
      ['• AadhaarNumber - 12-digit Aadhaar number'],
      ['• AdmissionSoughtIn - arts/commerce/science (for higher classes)'],
      ['• PreviousExamDetails - JSON format for exam history'],
      ['• Status - active/inactive/transferred/graduated/dropped'],
      [''],
      ['Parent/Guardian Information:'],
      ['• Father Details - Name, Phone, Email, Occupation, Qualification, Income'],
      ['• Mother Details - Name, Phone, Email, Occupation, Qualification, Income'],
      ['• Guardian Details - Name, Phone, Email, Occupation, Qualification, Income, Relation, Address'],
      [''],
      ['Data Format Guidelines:'],
      ['• Dates: YYYY-MM-DD format only (e.g., 2005-06-15)'],
      ['• Gender: male, female, or other'],
      ['• Category: general, obc, sc, st, or other'],
      ['• Status: active, inactive, transferred, graduated, or dropped'],
      ['• AdmissionSoughtIn: arts, commerce, or science'],
      ['• GuardianRelation: father, mother, or guardian'],
      ['• Income: Numeric values only (no currency symbols)'],
      ['• AadhaarNumber: Exactly 12 digits'],
      ['• PreviousExamDetails: Valid JSON format for exam history'],
      [''],
      ['Tips:'],
      ['• Leave optional fields empty if not available'],
      ['• Ensure admission numbers are unique'],
      ['• Use class names exactly as they appear in your system'],
      ['• For minimal import, use the "required" template instead']
    ];
    
    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow([instruction[0]]);
      if (index === 0) {
        row.font = { bold: true, size: 14 };
      } else if (instruction[0] && (instruction[0].includes('Required') || instruction[0].includes('Optional') || instruction[0].includes('Parent') || instruction[0].includes('Data Format') || instruction[0].includes('Tips'))) {
        row.font = { bold: true };
      }
    });
    
    // Auto-fit instruction columns
    instructionsSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 80 ? 80 : maxLength + 2;
    });
    
    // Set response headers for Excel download
    const filename = `student-import-template-complete-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write Excel file to response
    await workbook.xlsx.write(res);
    res.end();
    
    logger.info('Student complete template generated successfully');
  } catch (error) {
    logger.error('Error generating student complete template:', error);
    return next(error);
  }
};

module.exports = {
  generateAttendanceTemplate,
  generateStudentTemplateRequired,
  generateStudentTemplateComplete,
};