const jwt = require('jsonwebtoken');

const validateToken = (token, successCB, errorCB) => jwt.verify(
  token,
  process.env.JWT_SECRET,
  (err, decoded) => {
    if (err) {
      return errorCB(err);
    }
    return successCB(decoded);
  }
);

module.exports = validateToken;
