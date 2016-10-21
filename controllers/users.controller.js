const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const setPermissionsForFollowingRoutes = require('./helpers/setPermissionsForFollowingRoutes');

// POST /users - anyone can access
router.post('/', (req, res) => {

  if (!req.body.first_name) return notProvidedFieldErrorResponse(res, 'first_name');
  if (!req.body.last_name) return notProvidedFieldErrorResponse(res, 'last_name');
  if (!req.body.email) return notProvidedFieldErrorResponse(res, 'email');
  if (!req.body.password) return notProvidedFieldErrorResponse(res, 'password');
  if (!req.body.role) return notProvidedFieldErrorResponse(res, 'role');
  if (!req.body.accountId) return notProvidedFieldErrorResponse(res, 'accountId');

  models.User
    .findOne({
      where: { email: req.body.email }
    })
    .then((user) => {

      if (user)
        return res.status(403).json({
          success: false,
          message: 'error: user already exists with that email'
        });

      models.User
        .create({
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          password: models.User.generateHash(req.body.password),
          role: normalizeStringToInteger(req.body.role),
          AccountId: req.body.accountId
        })
        .then((success) => {
          return res.json({
            success: true
          });
        })
        .catch((err) => {
          throw err;
        });

    })
    .catch((err) => {
      throw err;
    });

});

// POST /users/login - anyone can access
router.post('/login', (req, res) => {

  if (!req.body.email) return notProvidedFieldErrorResponse(res, 'email');
  if (!req.body.password) return notProvidedFieldErrorResponse(res, 'password');

  models.User
    .findOne({
      where: { email: req.body.email }
    })
    .then((user) => {

      if (!user)
        return notProvidedFieldErrorResponse(res, null, 
          'error: a user with that email does not exist');

      if (!models.User.validPassword(req.body.password, user.dataValues.password))
        return notProvidedFieldErrorResponse(res, null, 'error: wrong password');

      else {

        const userObj = {
          id: user.dataValues.id,
          email: req.body.email,
          role: user.dataValues.role,
          accountId: user.dataValues.AccountId
        };

        req.session.user = userObj;
        if (process.env.NODE_ENV === 'test') {
          res.cookie('userRole', JSON.stringify(userObj.role));
        }
        res.json({
          success: true
        });

      }

    })
    .catch((err) => {
      throw err;
    });

});

// middleware that restricts the following routes to the role provided
// any route below this will need an admin role to access 
// the last param is 1 to specify the admin role
router.use((req, res, next) => setPermissionsForFollowingRoutes(req, res, next, 1));

// GET /users - ADMIN ONLY
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GET /users - ADMIN ONLY'
  });
});

module.exports = router;