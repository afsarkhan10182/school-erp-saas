const ExcelJS = require('exceljs');
const httpStatus = require('http-status');
const { logger } = require('~/utils/logger');

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

module.exports = {
  generateAttendanceTemplate,
};