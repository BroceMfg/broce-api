const router = require('express').Router();
const models = require('../models');
const jwt = require('jsonwebtoken');
const notProvidedFieldErrorResponse = require('../public/js/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('../public/js/normalizeStringToInteger');

router.post('/', (req, res) => {

  if (!req.body.first_name) return notProvidedFieldErrorResponse(res, 'first_name');
  if (!req.body.last_name) return notProvidedFieldErrorResponse(res, 'last_name');
  if (!req.body.email) return notProvidedFieldErrorResponse(res, 'email_name');
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

// router.post('/login', (req, res) => {

//   //

// });

module.exports = router;