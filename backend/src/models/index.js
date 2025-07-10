const { sequelize } = require('../config/database');
const User = require('./User');
const School = require('./School');
const Branch = require('./Branch');
const SubscriptionPlan = require('./SubscriptionPlan');
const Transaction = require('./Transaction');

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