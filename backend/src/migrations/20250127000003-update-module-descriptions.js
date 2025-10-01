'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('📝 Updating module descriptions to reflect current functionality...');

      // Update Student Management description
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'students'`,
        {
          replacements: {
            description: 'Admit students, manage profiles, enrollments, and student records'
          },
          transaction
        }
      );
      console.log('✅ Updated Student Management description');

      // Update Academic Management description (already correct, but let's make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'academic_management'`,
        {
          replacements: {
            description:
              'Subject management, class assignments, timetable management, and academic configuration'
          },
          transaction
        }
      );
      console.log('✅ Updated Academic Management description');

      // Update Attendance Management description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'attendance'`,
        {
          replacements: {
            description: 'Track student and staff attendance with reports and notifications'
          },
          transaction
        }
      );
      console.log('✅ Updated Attendance Management description');

      // Update Examination Management description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'exams'`,
        {
          replacements: {
            description: 'Exam schedules, results, grades, and academic performance tracking'
          },
          transaction
        }
      );
      console.log('✅ Updated Examination Management description');

      // Update Fee Management description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'fees'`,
        {
          replacements: {
            description: 'Fee types, structures, invoices, payments, and collections'
          },
          transaction
        }
      );
      console.log('✅ Updated Fee Management description');

      // Update Library Management description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'library'`,
        {
          replacements: {
            description: 'Book catalog, issue/return, fine management, and library reports'
          },
          transaction
        }
      );
      console.log('✅ Updated Library Management description');

      // Update Transport Management description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'transport'`,
        {
          replacements: {
            description: 'Bus routes, vehicle management, student transportation tracking'
          },
          transaction
        }
      );
      console.log('✅ Updated Transport Management description');

      // Update Human Resources description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'hr'`,
        {
          replacements: {
            description: 'Staff management, payroll, leave management, and HR reports'
          },
          transaction
        }
      );
      console.log('✅ Updated Human Resources description');

      // Update Advanced Reports description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'reports'`,
        {
          replacements: {
            description: 'Comprehensive analytics, custom reports, and data export'
          },
          transaction
        }
      );
      console.log('✅ Updated Advanced Reports description');

      // Update System Settings description (make it more specific)
      await queryInterface.sequelize.query(
        `UPDATE modules SET description = :description WHERE code = 'settings'`,
        {
          replacements: {
            description: 'School configuration, user management, and system preferences'
          },
          transaction
        }
      );
      console.log('✅ Updated System Settings description');

      await transaction.commit();
      console.log('🎉 Module descriptions updated successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error updating module descriptions:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Reverting module descriptions...');

      // Revert all descriptions to their previous state
      const descriptions = {
        students: 'Admit students, manage profiles, class assignments, and student records',
        academic_management:
          'Advanced academic management features including subject management, class assignments, and timetable management',
        attendance: 'Track student and staff attendance with reports and notifications',
        exams: 'Exam schedules, results, grades, and academic performance tracking',
        fees: 'Fee types, structures, invoices, payments, and collections',
        library: 'Book catalog, issue/return, fine management, and library reports',
        transport: 'Bus routes, vehicle management, student transportation tracking',
        hr: 'Staff management, payroll, leave management, and HR reports',
        reports: 'Comprehensive analytics, custom reports, and data export',
        settings: 'School configuration, user management, and system preferences'
      };

      for (const [code, description] of Object.entries(descriptions)) {
        await queryInterface.sequelize.query(
          `UPDATE modules SET description = :description WHERE code = :code`,
          {
            replacements: { code, description },
            transaction
          }
        );
      }

      await transaction.commit();
      console.log('✅ Module descriptions reverted');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting module descriptions:', error);
      throw error;
    }
  }
};
