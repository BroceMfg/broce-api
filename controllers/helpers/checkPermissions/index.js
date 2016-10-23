if (process.env.NODE_ENV === 'test')
  module.exports = require('./checkPermissions.test');
else
  module.exports = require('./checkPermissions');