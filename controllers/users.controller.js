const router = require('express').Router();
const models = require('../models');
const jwt = require('jsonwebtoken');

router.post('/', (req, res) => {

  const notProvidedErrorResponse = (field) => {
    return res.status(403).json({
      success: false,
      message: `error: no ${field} provided`
    });
  }

  if (!req.body.first_name) return notProvidedErrorResponse('first_name');
  if (!req.body.last_name) return notProvidedErrorResponse('last_name');
  if (!req.body.email) return notProvidedErrorResponse('email_name');
  if (!req.body.password) return notProvidedErrorResponse('password');
  if (!req.body.role) return notProvidedErrorResponse('role');
  if (!req.body.accountId) return notProvidedErrorResponse('accountId');

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

      const normalizeIntegerString = (x) => {
        const result = parseInt(x);
        return (typeof result == 'number') ? result : undefined;
      }

      models.User
        .create({
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          password: models.User.generateHash(req.body.password),
          role: normalizeIntegerString(req.body.role),
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

})

module.exports = router;