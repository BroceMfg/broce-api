const normalizeNumberString = require('../normalizeNumberString');

const checkPermissions = (req, res, role, userId, cb) => {

  let userRole = (req.cookies && req.cookies.userRole) ? 
    normalizeNumberString(req.cookies.userRole) : undefined;
  if (userRole === undefined) {
    userRole = (req.query && req.query.userRole) ? 
      normalizeNumberString(req.query.userRole) : undefined;
  }

  if (userId != undefined) {
    
    let id = (req.cookies && req.cookies.userId) ? 
      normalizeNumberString(req.cookies.userId) : undefined;
    if (id === undefined) {
      id = (req.query && req.query.userId) ? 
        normalizeNumberString(req.query.userId) : undefined;
    }

    if (id === undefined) {
      return res.status(403).json({
        success: false,
        message: 'error: no user data found'
      });
    } else if (userRole === 1) {
      // admin has permissions that any user has
      return cb();
    } else if (id === userId) {
      // user can access own self
      return cb();
    } else {
      // user is trying to access a route they don't have permission to
      return res.status(403).json({
        success: false,
        message: 'error: permission denied'
      });
    }

  } else if (role != undefined) {

    if (userRole === undefined) {
      return res.status(403).json({
        success: false,
        message: 'error: no user data found'
      });
    } else if (userRole >= role) {
      return cb();
    } else {
      return res.status(403).json({
        success: false,
        message: 'error: permission denied'
      });
    }

  } else {
    return res.status(500).json({
      success: false,
      message: 'error: internal server error'
    });
  }
}

module.exports = checkPermissions;