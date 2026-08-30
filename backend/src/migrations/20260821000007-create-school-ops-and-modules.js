'use strict';

const { NEW_MODULES } = require('../config/school-ops-entities');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const exists = await queryInterface.describeTable('school_ops_records').catch(() => null);
      if (!exists) {
        await queryInterface.createTable(
          'school_ops_records',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true,
              allowNull: false
            },
            entity_type: { type: Sequelize.STRING(80), allowNull: false },
            title: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
            reference_no: { type: Sequelize.STRING(80), allowNull: true },
            date_value: { type: Sequelize.DATEONLY, allowNull: true },
            amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
            student_id: { type: Sequelize.UUID, allowNull: true },
            user_id: { type: Sequelize.UUID, allowNull: true },
            class_id: { type: Sequelize.UUID, allowNull: true },
            related_id: { type: Sequelize.UUID, allowNull: true },
            payload: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            notes: { type: Sequelize.TEXT, allowNull: true },
            school_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: 'schools', key: 'id' }
            },
            branch_id: { type: Sequelize.UUID, allowNull: true },
            created_by: { type: Sequelize.UUID, allowNull: true },
            updated_by: { type: Sequelize.UUID, allowNull: true },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn('NOW')
            },
            updated_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn('NOW')
            }
          },
          { transaction }
        );
        await queryInterface.addIndex('school_ops_records', ['school_id', 'entity_type'], {
          transaction
        });
      }

      const parentCols = await queryInterface.describeTable('parents');
      if (!parentCols.user_id) {
        await queryInterface.addColumn(
          'parents',
          'user_id',
          { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
          { transaction }
        );
      }

      for (const mod of NEW_MODULES) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM modules WHERE code = :code LIMIT 1`,
          { replacements: { code: mod.code }, transaction }
        );
        if (existing.length) continue;

        await queryInterface.bulkInsert(
          'modules',
          [
            {
              id: Sequelize.literal('gen_random_uuid()'),
              code: mod.code,
              name: mod.name,
              description: mod.description,
              icon: mod.code.slice(0, 2).toUpperCase(),
              features: JSON.stringify([mod.name]),
              category: mod.category,
              is_active: true,
              is_core: false,
              sort_order: mod.sort_order,
              version: '1.0.0',
              dependencies: JSON.stringify([]),
              permissions: JSON.stringify([`manage_${mod.code}`, `view_${mod.code}`]),
              created_at: new Date(),
              updated_at: new Date()
            }
          ],
          { transaction }
        );

        const [moduleRecord] = await queryInterface.sequelize.query(
          `SELECT id FROM modules WHERE code = :code`,
          { replacements: { code: mod.code }, transaction }
        );
        const [plans] = await queryInterface.sequelize.query(
          `SELECT id FROM subscription_plans WHERE is_active = true`,
          { transaction }
        );
        if (plans.length && moduleRecord[0]) {
          await queryInterface.bulkInsert(
            'plan_modules',
            plans.map(plan => ({
              id: Sequelize.literal('gen_random_uuid()'),
              subscription_plan_id: plan.id,
              module_id: moduleRecord[0].id,
              is_required: false,
              is_enabled: true,
              sort_order: mod.sort_order,
              created_at: new Date(),
              updated_at: new Date()
            })),
            { transaction }
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    try {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TYPE "enum_users_role" ADD VALUE 'student';
        EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; WHEN others THEN NULL;
        END $$;
      `);
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TYPE "enum_users_role" ADD VALUE 'parent';
        EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; WHEN others THEN NULL;
        END $$;
      `);
    } catch (enumError) {
      // Ignore if the enum type name differs on this database
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('school_ops_records');
  }
};
