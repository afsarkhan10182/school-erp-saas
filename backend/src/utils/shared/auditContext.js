const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

const run = (context, callback) => storage.run(context, callback);
const update = values => {
  const context = storage.getStore();
  if (context) Object.assign(context, values);
};

module.exports = { run, update, get: () => storage.getStore() };
