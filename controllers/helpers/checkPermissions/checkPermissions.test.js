const normalizeNumberString = require('../normalizeNumberString');
const internalServerError = require('../internalServerError');
const noUserData = require('../noUserData');
const permissionDenied = require('../permissionDenied');

const checkPermissions = (req, res, role, userId, cb) => {

  const userRole = require('./getUserRole.test')(req);

  if (userId != undefined) {
    
    const id = require('./getUserId.test')(req);

    if (id === undefined) {
      return noUserData(res);
    } else if (userRole === 1) {
      // admin has permissions that any user has
      return cb();
    } else if (id === userId) {
      // user can access own self
      return cb();
    } else {
      // user is trying to access a route they don't have permission to
      return permissionDenied(res);
    }

  } else if (role != undefined) {

    if (userRole === undefined) {
      return noUserData(res);
    } else if (userRole >= role) {
      return cb();
    } else {
      return permissionDenied(res);
    }

  } else {
    return internalServerError(res);
  }
}

module.exports = checkPermissions;