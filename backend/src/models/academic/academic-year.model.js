const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const AcademicYear = sequelize.define(
  'AcademicYear',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Academic year name is required' },
        len: {
          args: [7, 50],
          msg: 'Academic year name must be between 7 and 50 characters (e.g., "2024-2025")'
        }
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Academic year code is required' },
        len: { args: [2, 20], msg: 'Academic year code must be between 2 and 20 characters' }
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Start date is required' }
      }
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'End date is required' }
      }
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'completed'),
      allowNull: false,
      defaultValue: 'active'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    tableName: 'academic_years',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['name'], unique: true }, { fields: ['is_current'] }],
    hooks: {
      beforeCreate: async academicYear => {
        // Ensure only one current academic year globally
        if (academicYear.is_current) {
          await AcademicYear.update({ is_current: false }, { where: { is_current: true } });
        }
      },
      beforeUpdate: async academicYear => {
        // Ensure only one current academic year globally
        if (academicYear.is_current) {
          await AcademicYear.update(
            { is_current: false },
            { where: { is_current: true, id: { [require('sequelize').Op.ne]: academicYear.id } } }
          );
        }
      },
      afterUpdate: async academicYear => {
        // If this academic year is now current, update all schools to link to it
        if (academicYear.is_current) {
          try {
            const { School } = require('~/models');
            await School.update(
              { current_academic_year_id: academicYear.id },
              {
                where: {
                  current_academic_year_id: { [require('sequelize').Op.ne]: academicYear.id }
                }
              }
            );
            logger.info(
              `Updated all schools to link to new current academic year: ${academicYear.name}`
            );
          } catch (error) {
            logger.error('Error updating schools to new current academic year:', error);
          }
        }
      },
      afterCreate: async academicYear => {
        logger.info(`New global academic year created: ${academicYear.name}`);
      }
    }
  }
);

// Define associations
AcademicYear.associate = models => {
  // AcademicYear belongs to User (created_by)
  AcademicYear.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // AcademicYear belongs to User (updated_by)
  AcademicYear.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });

  // AcademicYear has many Schools (as current academic year)
  AcademicYear.hasMany(models.School, {
    foreignKey: 'current_academic_year_id',
    as: 'schools'
  });
};

module.exports = AcademicYear;
