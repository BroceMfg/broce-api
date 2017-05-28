const jwt = require('jsonwebtoken');

const createToken = (signableK, signableV) => {
  const signable = {};
  signable[signableK] = signableV;
  return jwt.sign(Object.assign(
    { exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) }, // 24 hours
    signable
  ), process.env.JWT_SECRET);
};

module.exports = createToken;
