const normalizeNumberString = require('../normalizeNumberString');

const getUserRole = (req) => {
  let userRole = (req.cookies && req.cookies.userRole) ? 
    normalizeNumberString(req.cookies.userRole) : undefined;
  if (userRole === undefined) {
    userRole = (req.query && req.query.userRole) ? 
      normalizeNumberString(req.query.userRole) : undefined;
  }
  return userRole;
}

module.exports = getUserRole;