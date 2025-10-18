const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const Term = sequelize.define(
  'Term',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Term name is required' }
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  },
  {
    tableName: 'terms',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['academic_year'] },
      { fields: ['is_active'] },
      { fields: ['start_date', 'end_date'] },
      { fields: ['school_id', 'branch_id', 'academic_year', 'code'], unique: true }
    ],
    hooks: {
      afterCreate: async term => {
        logger.info(
          `Term created: ${term.name} (${term.code}) for academic year ${term.academic_year}`
        );
      }
    }
  }
);

Term.associate = models => {
  Term.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Term.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  Term.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  Term.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = Term;
