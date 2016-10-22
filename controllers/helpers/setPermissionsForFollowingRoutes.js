const normalizeNumberString = require('./normalizeNumberString');

// takes in req, res, next from Express
// role should be a number (1 is admin, 0 is client)
const setPermissionsForFollowingRoutes = (req, res, next, role) => {

  if (process.env.NODE_ENV === 'test') {

    let userRole = (req.cookies && req.cookies.userRole) ? 
      normalizeNumberString(req.cookies.userRole) : undefined;

    // TODO add support for taking in userRole value as a url query

    // because of the way the chai request lib works, we need to use reg cookies for auth in the test env
    if (userRole === undefined) {
      return res.status(403).json({
        success: false,
        message: 'error: no user data found'
      });
    }

    else if (userRole >= role) next();

    else if (userRole != role) {
      return res.status(403).json({
        success: false,
        message: 'error: permission denied'
      });
    }

  } else {

    // in normal environments such as dev, prod, etc. we'll user redis sessions for security purposes
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
      next();
    } else {
      // user is trying to access a route they don't have permission to
      return res.status(403).json({
        success: false,
        message: 'error: permission denied'
      });
    }
  }
}

module.exports = setPermissionsForFollowingRoutes;