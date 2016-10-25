const normalizeNumberString = require('../normalizeNumberString');

const checkPermissions = (req, res, role, userId, cb) => {
  if (!req.session) {
    // for some reason we didn't give them a session cookie
    return res.status(500).json({
      success: false,
      message: 'error: internal server error'
    });
  }

  if (!req.session.user) {
    // no user session cookie
    return res.status(403).json({
      success: false,
      message: 'error: no user data found'
    });
  }

  if (userId != undefined) {
    if (normalizeNumberString(req.session.user.role) === 1) {
      // admin has permissions that any user has
      return cb();
    } else if (normalizeNumberString(req.session.user.id) === userId) {
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
    if (req.session.user.role >= role) {
      return cb();
    } else {
      // user is trying to access a route they don't have permission to
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