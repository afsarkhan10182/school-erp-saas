const { sequelize } = require('../config/database');
const User = require('./user.model');
const School = require('./school.model');
const Branch = require('./branch.model');
const SubscriptionPlan = require('./subscription-plan.model');
const Transaction = require('./transaction.model');
const SubscriptionRenewalRequest = require('./subscription-renewal-request.model');
const Student = require('./student.model');
const Parent = require('./parent.model');
const StudentParent = require('./student-parent.model');
const FeeType = require('./fee-type.model');
const FeeStructure = require('./fee-structure.model');
const FeeInvoice = require('./fee-invoice.model');
const AcademicYear = require('./academic-year.model');
const Class = require('./class.model');
const Section = require('./section.model');
const Admission = require('./admission.model');

// Initialize associations
const models = {
  User,
  School,
  Branch,
  SubscriptionPlan,
  Transaction,
  SubscriptionRenewalRequest,
  Student,
  Parent,
  StudentParent,
  FeeType,
  FeeStructure,
  FeeInvoice,
  AcademicYear,
  Class,
  Section,
  Admission,
};

// Call associate function for each model if it exists
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
