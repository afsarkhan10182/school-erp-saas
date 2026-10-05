const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Alumni = sequelize.define(
  'Alumni',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passing_year: {
      type: DataTypes.STRING
    },
    current_profession: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    photo: {
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'alumnis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Alumni.associate = models => {
  Alumni.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  Alumni.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
  if (models.Student) {
    Alumni.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'student'
    });
  }
};

module.exports = Alumni;
