'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, add a temporary column with the new integer type
    await queryInterface.addColumn('timetable_slots', 'day_of_week_temp', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Update the temporary column with converted values
    await queryInterface.sequelize.query(`
      UPDATE timetable_slots 
      SET day_of_week_temp = CASE 
        WHEN day_of_week = 'monday' THEN 1
        WHEN day_of_week = 'tuesday' THEN 2
        WHEN day_of_week = 'wednesday' THEN 3
        WHEN day_of_week = 'thursday' THEN 4
        WHEN day_of_week = 'friday' THEN 5
        WHEN day_of_week = 'saturday' THEN 6
        WHEN day_of_week = 'sunday' THEN 7
        ELSE 1
      END
    `);

    // Drop the old column
    await queryInterface.removeColumn('timetable_slots', 'day_of_week');

    // Rename the temporary column to the original name
    await queryInterface.renameColumn('timetable_slots', 'day_of_week_temp', 'day_of_week');

    // Add the NOT NULL constraint
    await queryInterface.changeColumn('timetable_slots', 'day_of_week', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Add a temporary column with the old string type
    await queryInterface.addColumn('timetable_slots', 'day_of_week_temp', {
      type: Sequelize.ENUM(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ),
      allowNull: true
    });

    // Update the temporary column with converted values
    await queryInterface.sequelize.query(`
      UPDATE timetable_slots 
      SET day_of_week_temp = CASE 
        WHEN day_of_week = 1 THEN 'monday'
        WHEN day_of_week = 2 THEN 'tuesday'
        WHEN day_of_week = 3 THEN 'wednesday'
        WHEN day_of_week = 4 THEN 'thursday'
        WHEN day_of_week = 5 THEN 'friday'
        WHEN day_of_week = 6 THEN 'saturday'
        WHEN day_of_week = 7 THEN 'sunday'
        ELSE 'monday'
      END
    `);

    // Drop the old column
    await queryInterface.removeColumn('timetable_slots', 'day_of_week');

    // Rename the temporary column to the original name
    await queryInterface.renameColumn('timetable_slots', 'day_of_week_temp', 'day_of_week');

    // Add the NOT NULL constraint
    await queryInterface.changeColumn('timetable_slots', 'day_of_week', {
      type: Sequelize.ENUM(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ),
      allowNull: false
    });
  }
};
