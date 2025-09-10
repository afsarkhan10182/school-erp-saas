const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const {
  AttendanceSession,
  AttendanceRecord,
  Student,
  Class,
  Section,
  School,
  Branch
} = require('~/models');
const { logger } = require('~/utils/logger');
const { Op } = require('sequelize');

class AttendanceExportService {
  /**
   * Get attendance data for export
   */
  async getAttendanceData(filters = {}) {
    try {
      const {
        school_id,
        branch_id,
        class_id,
        section_id,
        date_from,
        date_to,
        attendance_type,
        subject_id,
        academic_year
      } = filters;

      // Build where clause
      const whereClause = {};

      if (school_id) whereClause.school_id = school_id;
      if (branch_id) whereClause.branch_id = branch_id;
      if (class_id) whereClause.class_id = class_id;
      if (section_id) whereClause.section_id = section_id;
      if (attendance_type) whereClause.attendance_type = attendance_type;
      if (subject_id) whereClause.subject_id = subject_id;
      if (academic_year) whereClause.academic_year = academic_year;

      if (date_from && date_to) {
        whereClause.date = {
          [Op.between]: [date_from, date_to]
        };
      } else if (date_from) {
        whereClause.date = {
          [Op.gte]: date_from
        };
      } else if (date_to) {
        whereClause.date = {
          [Op.lte]: date_to
        };
      }

      // Build include array with proper error handling
      const includeArray = [];

      try {
        includeArray.push({
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code', 'numeric_value'],
          required: false
        });
      } catch (e) {
        logger.warn('Class association not available');
      }

      try {
        includeArray.push({
          model: Section,
          as: 'section',
          attributes: ['id', 'name'],
          required: false
        });
      } catch (e) {
        logger.warn('Section association not available');
      }

      try {
        includeArray.push({
          model: School,
          as: 'school',
          attributes: ['id', 'name'],
          required: false
        });
      } catch (e) {
        logger.warn('School association not available');
      }

      try {
        includeArray.push({
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          required: false
        });
      } catch (e) {
        logger.warn('Branch association not available');
      }

      try {
        includeArray.push({
          model: AttendanceRecord,
          as: 'records',
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'admission_number', 'roll_number', 'first_name', 'last_name'],
              required: false
            }
          ]
        });
      } catch (e) {
        logger.warn('AttendanceRecord or Student association not available');
      }

      const sessions = await AttendanceSession.findAll({
        where: whereClause,
        include: includeArray,
        order: [
          ['date', 'ASC'],
          ['period_number', 'ASC']
        ]
      });

      logger.info(`Found ${sessions.length} attendance sessions for export`);
      logger.info(`Export filters used:`, filters);

      if (sessions.length === 0) {
        logger.warn('No attendance sessions found with the provided filters');
      }

      return sessions;
    } catch (error) {
      logger.error('Error getting attendance data for export:', error);
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(filters = {}) {
    try {
      const data = await this.getAttendanceData(filters);

      if (!data.length) {
        // Generate a PDF with "No data found" message instead of throwing error
        const doc = new PDFDocument({ margin: 50 });

        doc.fontSize(18).text('Attendance Report', { align: 'center' });
        doc.moveDown();
        doc
          .fontSize(14)
          .text('No attendance data found for the selected criteria.', { align: 'center' });
        doc.moveDown();
        doc
          .fontSize(12)
          .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

        return doc;
      }

      const doc = new PDFDocument({ margin: 50 });

      // Header
      const school = data[0].school;
      const branch = data[0].branch;

      doc.fontSize(18).text(`${school.name}`, { align: 'center' });
      if (branch) {
        doc.fontSize(14).text(`${branch.name}`, { align: 'center' });
      }
      doc.moveDown();

      doc.fontSize(16).text('Attendance Report', { align: 'center' });
      doc.moveDown();

      // Report details
      doc.fontSize(12);
      const reportDate = new Date().toLocaleDateString();
      doc.text(`Generated on: ${reportDate}`, { align: 'right' });

      if (filters.date_from && filters.date_to) {
        doc.text(`Period: ${filters.date_from} to ${filters.date_to}`, { align: 'right' });
      } else if (filters.date_from) {
        doc.text(`From: ${filters.date_from}`, { align: 'right' });
      }

      if (data[0].class) {
        doc.text(`Class: ${data[0].class.name}`, { align: 'right' });
      }

      if (data[0].section) {
        doc.text(`Section: ${data[0].section.name}`, { align: 'right' });
      }

      if (filters.academic_year) {
        doc.text(`Academic Year: ${filters.academic_year}`, { align: 'right' });
      }

      doc.moveDown();

      // Group data by date
      const groupedData = {};
      data.forEach(session => {
        const dateKey = session.date;
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = [];
        }
        groupedData[dateKey].push(session);
      });

      // Generate content for each date
      Object.keys(groupedData).forEach((date, dateIndex) => {
        if (dateIndex > 0) {
          doc.addPage();
        }

        doc.fontSize(14).text(`Date: ${date}`, { underline: true });
        doc.moveDown();

        groupedData[date].forEach((session, sessionIndex) => {
          if (sessionIndex > 0) {
            doc.moveDown();
          }

          // Session header
          let sessionTitle = `${session.attendance_type.toUpperCase()} Attendance`;
          if (session.attendance_type === 'period') {
            sessionTitle += ` - Period ${session.period_number}`;
            if (session.subject) {
              sessionTitle += ` (${session.subject.name})`;
            }
          }

          doc.fontSize(12).text(sessionTitle, { underline: true });
          doc.moveDown(0.5);

          // Attendance statistics
          const records = session.records || [];
          const totalStudents = records.length;
          const presentCount = records.filter(r => r.status === 'present').length;
          const absentCount = records.filter(r => r.status === 'absent').length;
          const lateCount = records.filter(r => r.status === 'late').length;
          const excusedCount = records.filter(r => r.status === 'excused').length;

          doc.text(`Total Students: ${totalStudents}`);
          doc.text(
            `Present: ${presentCount}, Absent: ${absentCount}, Late: ${lateCount}, Excused: ${excusedCount}`
          );
          doc.moveDown(0.5);

          // Student details
          if (records.length > 0) {
            // Table headers
            const startY = doc.y;
            let currentY = startY;

            // Check if we have enough space for headers + at least 5 rows
            if (currentY > 650) {
              doc.addPage();
              currentY = 50;
            }

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Admission No.', 50, currentY, { width: 80 });
            doc.text('Student Name', 130, currentY, { width: 120 });
            doc.text('Status', 250, currentY, { width: 60 });
            doc.text('Remarks', 310, currentY, { width: 220 });

            currentY += 15;
            doc.moveTo(50, currentY).lineTo(530, currentY).stroke();
            currentY += 5;

            doc.fontSize(9).font('Helvetica');

            records.forEach(record => {
              const student = record.student;
              const studentName = `${student.first_name} ${student.last_name || ''}`.trim();

              // Check if we need a new page
              if (currentY > 720) {
                doc.addPage();
                currentY = 50;

                // Repeat headers on new page
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Admission No.', 50, currentY, { width: 80 });
                doc.text('Student Name', 130, currentY, { width: 120 });
                doc.text('Status', 250, currentY, { width: 60 });
                doc.text('Remarks', 310, currentY, { width: 220 });

                currentY += 15;
                doc.moveTo(50, currentY).lineTo(530, currentY).stroke();
                currentY += 5;
                doc.fontSize(9).font('Helvetica');
              }

              // Truncate long text to prevent overlapping
              const truncatedName =
                studentName.length > 20 ? studentName.substring(0, 17) + '...' : studentName;
              const truncatedRemarks =
                (record.remarks || '').length > 25
                  ? (record.remarks || '').substring(0, 22) + '...'
                  : record.remarks || '';

              // Use precise positioning with proper column widths
              doc.text(student.admission_number || '', 50, currentY, { width: 75, ellipsis: true });
              doc.text(truncatedName, 130, currentY, { width: 115, ellipsis: true });
              doc.text(record.status.toUpperCase(), 250, currentY, { width: 55, ellipsis: true });
              doc.text(truncatedRemarks, 310, currentY, { width: 215, ellipsis: true });

              currentY += 12; // Consistent row height
            });

            doc.y = currentY + 10;
          }
        });
      });

      return doc;
    } catch (error) {
      logger.error('Error generating PDF report:', error);
      throw error;
    }
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(filters = {}) {
    try {
      const data = await this.getAttendanceData(filters);

      if (!data.length) {
        // Generate Excel with "No data found" message
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        worksheet.getCell('A1').value = 'Attendance Report - No Data Found';
        worksheet.getCell('A1').font = { bold: true, size: 16 };

        worksheet.getCell('A3').value = 'No attendance data found for the selected criteria.';
        worksheet.getCell('A5').value = `Generated on: ${new Date().toLocaleDateString()}`;

        return workbook;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      // Set up styles
      const headerStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6FA' } },
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      const cellStyle = {
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Add headers
      const school = data[0].school;
      const branch = data[0].branch;

      worksheet.mergeCells('A1:J1');
      worksheet.getCell('A1').value = `${school.name} - Attendance Report`;
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      if (branch) {
        worksheet.mergeCells('A2:J2');
        worksheet.getCell('A2').value = branch.name;
        worksheet.getCell('A2').font = { bold: true, size: 14 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
      }

      let currentRow = branch ? 4 : 3;

      // Report metadata
      worksheet.getCell(`A${currentRow}`).value = 'Generated on:';
      worksheet.getCell(`B${currentRow}`).value = new Date().toLocaleDateString();
      currentRow++;

      if (filters.date_from && filters.date_to) {
        worksheet.getCell(`A${currentRow}`).value = 'Period:';
        worksheet.getCell(`B${currentRow}`).value = `${filters.date_from} to ${filters.date_to}`;
        currentRow++;
      }

      if (data[0].class) {
        worksheet.getCell(`A${currentRow}`).value = 'Class:';
        worksheet.getCell(`B${currentRow}`).value = data[0].class.name;
        currentRow++;
      }

      if (data[0].section) {
        worksheet.getCell(`A${currentRow}`).value = 'Section:';
        worksheet.getCell(`B${currentRow}`).value = data[0].section.name;
        currentRow++;
      }

      currentRow += 2; // Add spacing

      // Column headers
      const headers = [
        'Date',
        'Class',
        'Section',
        'Type',
        'Period',
        'Subject',
        'Admission No.',
        'Student Name',
        'Status',
        'Remarks'
      ];

      headers.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.style = headerStyle;
      });

      currentRow++;

      // Data rows
      data.forEach(session => {
        const records = session.records || [];

        if (records.length === 0) {
          // Show session even if no records
          const row = worksheet.getRow(currentRow);
          row.getCell(1).value = session.date;
          row.getCell(2).value = session.class ? session.class.name : '';
          row.getCell(3).value = session.section ? session.section.name : '';
          row.getCell(4).value = session.attendance_type.toUpperCase();
          row.getCell(5).value = session.period_number || '';
          row.getCell(6).value = session.subject ? session.subject.name : '';
          row.getCell(7).value = 'No students found';

          // Apply cell style
          for (let i = 1; i <= 10; i++) {
            row.getCell(i).style = cellStyle;
          }

          currentRow++;
        } else {
          records.forEach((record, recordIndex) => {
            const student = record.student;
            const studentName = `${student.first_name} ${student.last_name || ''}`.trim();

            const row = worksheet.getRow(currentRow);

            // Only show session details on first record
            if (recordIndex === 0) {
              row.getCell(1).value = session.date;
              row.getCell(2).value = session.class ? session.class.name : '';
              row.getCell(3).value = session.section ? session.section.name : '';
              row.getCell(4).value = session.attendance_type.toUpperCase();
              row.getCell(5).value = session.period_number || '';
              row.getCell(6).value = session.subject ? session.subject.name : '';
            }

            row.getCell(7).value = student.admission_number || '';
            row.getCell(8).value = studentName;
            row.getCell(9).value = record.status.toUpperCase();
            row.getCell(10).value = record.remarks || '';

            // Apply cell style
            for (let i = 1; i <= 10; i++) {
              row.getCell(i).style = cellStyle;
            }

            currentRow++;
          });
        }
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      return workbook;
    } catch (error) {
      logger.error('Error generating Excel report:', error);
      throw error;
    }
  }

  /**
   * Generate summary report (both PDF and Excel)
   */
  async generateSummaryData(filters = {}) {
    try {
      const data = await this.getAttendanceData(filters);

      const summary = {
        totalSessions: data.length,
        totalStudents: 0,
        attendanceByDate: {},
        attendanceByClass: {},
        attendanceByStatus: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        }
      };

      const uniqueStudents = new Set();

      data.forEach(session => {
        const dateKey = session.date;

        if (!summary.attendanceByDate[dateKey]) {
          summary.attendanceByDate[dateKey] = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0
          };
        }

        const classKey = session.class ? session.class.name : 'Unknown';
        if (!summary.attendanceByClass[classKey]) {
          summary.attendanceByClass[classKey] = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0
          };
        }

        session.records?.forEach(record => {
          uniqueStudents.add(record.student.id);

          summary.attendanceByStatus[record.status]++;
          summary.attendanceByDate[dateKey][record.status]++;
          summary.attendanceByDate[dateKey].total++;
          summary.attendanceByClass[classKey][record.status]++;
          summary.attendanceByClass[classKey].total++;
        });
      });

      summary.totalStudents = uniqueStudents.size;

      return summary;
    } catch (error) {
      logger.error('Error generating summary data:', error);
      throw error;
    }
  }
}

module.exports = new AttendanceExportService();
