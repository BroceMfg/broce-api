const normalizeNumberString = require('../normalizeNumberString');
const internalServerError = require('../internalServerError');
const noUserData = require('../noUserData');
const permissionDenied = require('../permissionDenied');

const checkPermissions = (req, res, role, userId, cb) => {
  if (!req.session) {
    // for some reason we didn't give them a session cookie
    return internalServerError(res);
  }

  if (!req.session.user) {
    // no user session cookie
    return noUserData(res);
  }

  if (userId != undefined) {
    console.log(req.session.user);
    if (normalizeNumberString(req.session.user.role) === 1) {
      // admin has permissions that any user has
      return cb();
    } else if (normalizeNumberString(req.session.user.id) === userId) {
      // user can access own self
      return cb();
    } else {
      // user is trying to access a route they don't have permission to
      return permissionDenied(res);
    }
  } else if (role != undefined) {
    if (typeof role === 'object') {
      if (role.some(r => req.session.user.role >= r)) {
        return cb();
      } else {
        return permissionDenied(res);
      }
    }
    else if (req.session.user.role >= role) {
      return cb();
    } else {
      // user is trying to access a route they don't have permission to
      return permissionDenied(res);
    }
  } else {
    return internalServerError(res);
  }
}

module.exports = checkPermissions;
