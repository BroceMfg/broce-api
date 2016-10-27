const normalizeNumberString = require('../normalizeNumberString');

const getUserId = (req) => {
  let id = (req.cookies && req.cookies.userId) ? 
    normalizeNumberString(req.cookies.userId) : undefined;
  if (id === undefined) {
    id = (req.query && req.query.userId) ? 
      normalizeNumberString(req.query.userId) : undefined;
  }
  return id;
}

module.exports  = getUserId;