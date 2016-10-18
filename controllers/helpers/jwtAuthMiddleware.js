const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
  // check header or url param or post params for token
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) {
        console.error(err);
        return res.json({
          success: false,
          message: 'Failed to authenticate token'
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token, return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided'
    });

  }
}

module.exports = jwtAuthMiddleware;