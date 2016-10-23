const normalizeNumberString = require('../normalizeNumberString');

const checkPermissions = (req, res, role, userId, cb) => {

  let userRole = (req.cookies && req.cookies.userRole) ? 
      normalizeNumberString(req.cookies.userRole) : undefined;
  if (userRole === undefined) {
    userRole = (req.query && req.query.userRole) ? 
      normalizeNumberString(req.query.userRole) : undefined;
  }

  // TODO add support for taking in userRole value as a url query

  // because of the way the chai request lib works, we need to use reg cookies for auth in the test env
  if (userRole === undefined) {
    return res.status(403).json({
      success: false,
      message: 'error: no user data found'
    });
  }

  else if (userRole >= role) return cb();

  else if (userRole != role) {
    return res.status(403).json({
      success: false,
      message: 'error: permission denied'
    });
  }

}

module.exports = checkPermissions;