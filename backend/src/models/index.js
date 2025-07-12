const { sequelize } = require('../config/database');
const User = require('./user.model');
const School = require('./school.model');
const Branch = require('./branch.model');
const SubscriptionPlan = require('./subscription-plan.model');
const Transaction = require('./transaction.model');

// Initialize associations
const models = {
  User,
  School,
  Branch,
  SubscriptionPlan,
  Transaction,
};

// Call associate function for each model if it exists
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  User,
  School,
  Branch,
  SubscriptionPlan,
  Transaction,
}; 