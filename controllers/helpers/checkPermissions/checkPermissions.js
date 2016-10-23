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

  if (req.session.user.role >= role) {
    req.session.user.roleVerification = role;
    return cb();
  } else {
    // user is trying to access a route they don't have permission to
    return res.status(403).json({
      success: false,
      message: 'error: permission denied'
    });
  }
}

module.exports = checkPermissions;