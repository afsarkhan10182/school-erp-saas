const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ParentTeacherMeetingStudent = sequelize.define(
  'ParentTeacherMeetingStudent',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    meeting_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    attendance_status: {
      type: DataTypes.ENUM('pending', 'present', 'absent', 'rescheduled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    teacher_remarks: { type: DataTypes.TEXT, allowNull: true },
    parent_rating: { type: DataTypes.SMALLINT, allowNull: true },
    parent_feedback: { type: DataTypes.TEXT, allowNull: true },
    parent_responded_at: { type: DataTypes.DATE, allowNull: true },
    feedback_parent_id: { type: DataTypes.UUID, allowNull: true },
    recorded_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'parent_teacher_meeting_students',
    timestamps: true,
    underscored: true
  }
);

ParentTeacherMeetingStudent.associate = models => {
  ParentTeacherMeetingStudent.belongsTo(models.ParentTeacherMeeting, {
    foreignKey: 'meeting_id',
    as: 'meeting'
  });
  ParentTeacherMeetingStudent.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student'
  });
  ParentTeacherMeetingStudent.belongsTo(models.Parent, {
    foreignKey: 'feedback_parent_id',
    as: 'feedbackParent'
  });
  ParentTeacherMeetingStudent.belongsTo(models.User, { foreignKey: 'recorded_by', as: 'recorder' });
};

module.exports = ParentTeacherMeetingStudent;
