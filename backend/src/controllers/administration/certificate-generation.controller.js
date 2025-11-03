const { Op } = require('sequelize');
const { Student } = require('~/models');

class CertificateGenerationController {
  /**
   * Generate certificates for students
   */
  static async generateStudentCertificates(req, res) {
    try {
      console.log('=== CERTIFICATE GENERATION REQUEST RECEIVED ===');
      console.log('Request URL:', req.url);
      console.log('Request Method:', req.method);
      console.log('Request Headers:', req.headers);
      console.log('Request Body:', req.body);

      const { student_ids, template_id, print_date, branch_id, class_id, section_id } = req.body;

      console.log('Certificate generation request:', {
        student_ids,
        template_id,
        print_date,
        branch_id,
        class_id,
        section_id
      });

      // Fetch actual student data from database
      const students = await Student.findAll({
        where: {
          id: {
            [Op.in]: student_ids
          }
        },
        attributes: [
          'id',
          'admission_number',
          'roll_number',
          'first_name',
          'last_name',
          'middle_name',
          'date_of_birth',
          'gender',
          'class_id',
          'section_id',
          'branch_id',
          'school_id'
        ]
      });

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No students found with the provided IDs'
        });
      }

      // Generate certificate data for print preview
      const generatedCertificates = [];
      const studentData = [];

      for (const student of students) {
        const certificateData = {
          student_id: student.id,
          template_id: template_id,
          print_date: print_date,
          generated_at: new Date(),
          status: 'ready_for_print'
        };

        generatedCertificates.push(certificateData);

        // Prepare student data for response
        const fullName = [student.first_name, student.middle_name, student.last_name]
          .filter(Boolean)
          .join(' ');

        studentData.push({
          id: student.id,
          name: fullName,
          admission_number: student.admission_number,
          roll_number: student.roll_number,
          date_of_birth: student.date_of_birth,
          gender: student.gender,
          class_id: student.class_id,
          section_id: student.section_id,
          branch_id: student.branch_id
        });
      }

      res.json({
        success: true,
        message: `Successfully prepared ${generatedCertificates.length} certificates for printing`,
        data: {
          certificates: generatedCertificates,
          template: {
            id: template_id,
            name: 'Certificate Template'
          },
          students: studentData
        }
      });
    } catch (error) {
      console.error('Error generating student certificates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificates',
        error: error.message
      });
    }
  }

  /**
   * Generate certificates for employees
   */
  static async generateEmployeeCertificates(req, res) {
    try {
      const { employee_ids, template_id, print_date, branch_id } = req.body;

      console.log('Employee certificate generation request:', {
        employee_ids,
        template_id,
        print_date,
        branch_id
      });

      // For now, return a success response with the data
      res.json({
        success: true,
        message: `Successfully generated ${employee_ids.length} certificates`,
        data: {
          certificates: employee_ids.map(id => ({
            employee_id: id,
            template_id: template_id,
            print_date: print_date,
            generated_at: new Date(),
            status: 'generated'
          })),
          template: {
            id: template_id,
            name: 'Certificate Template'
          },
          employees: employee_ids.map(id => ({
            id: id,
            name: 'Employee Name',
            employee_id: 'EMP-001'
          }))
        }
      });
    } catch (error) {
      console.error('Error generating employee certificates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificates',
        error: error.message
      });
    }
  }
}

module.exports = CertificateGenerationController;
