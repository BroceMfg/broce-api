const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBFindErrorAndRespondWithAppropriateJSON = require('./helpers/handleDBFindErrorAndRespondWithAppropriateJSON');

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
          res.cookie('userRole', userObj.role);
          res.cookie('userId', userObj.id);
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

// GET /users - ADMIN ONLY
router.get('/', (req, res) => {

  const cb = () => {
    models.User
      .findAll({})
      .then((users) => {
        res.json({
          users
        });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err);
      });
  }

  checkPermissions(req, res, 1, null, cb);

});

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

// GET /users/{id} - only the user or admin can access
router.get('/:id', (req, res) => {

  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {
    models.User
      .findOne({
        where: {
          id
        }
      })
      .then((user) => {
        res.json({
          user
        })
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err);
      });
  }

  checkPermissions(req, res, null, id, cb);

})

router.delete('/:id', (req, res) => {

  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {
    models.User
      .findOne({
        where: {
          id
        }
      })
      .then((user) => {
        user.destroy({ force: true })
          .then((success) => {
            res.json({
              success: true
            });
          })
          .catch((err) => {
            console.log(`error deleting user \n ${err.message}`);
            throw err;
          });
      })
      .catch((err) => {
        console.log(err.message);
        throw err;
      });
  }

  checkPermissions(req, res, null, id, cb);

});

module.exports = router;