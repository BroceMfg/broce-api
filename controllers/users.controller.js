const router = require('express').Router();
const models = require('../models');
const notProvidedError = require('./helpers/notProvidedError');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBError = require('./helpers/handleDBError');

// POST /users/login - anyone can access
router.post('/login', (req, res) => {

  if (!req.body.email) return notProvidedError(res, 'email');
  if (!req.body.password) return notProvidedError(res, 'password');

  models.User
    .findOne({
      where: { email: req.body.email }
    })
    .then((user) => {

      if (!user)
        return notProvidedError(res, null,
          'error: a user with that email does not exist');

      if (!models.User.validPassword(req.body.password, user.dataValues.password))
        return notProvidedError(res, null, 'error: wrong password');

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
          success: true,
          user: userObj
        });

      }

    })
    .catch((err) => {
      throw err;
    });

});

router.post('/logout', (req, res) => {

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error'
        });
      } else {
        res.json({ success: true });
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'User Not Found'
    });
  }

})

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
        handleDBError(err, res);
      });
  }

  checkPermissions(req, res, 1, null, cb);

});

// POST /users - anyone can access
router.post('/', (req, res) => {

  if (!req.body.first_name) return notProvidedError(res, 'first_name');
  if (!req.body.last_name) return notProvidedError(res, 'last_name');
  if (!req.body.email) return notProvidedError(res, 'email');
  if (!req.body.password) return notProvidedError(res, 'password');
  if (req.body.role == undefined) return notProvidedError(res, 'role');
  if (req.body.accountId == undefined) return notProvidedError(res, 'accountId');

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


// GET /users/addresses - get a user's stored address(es)
router.get('/addresses', (req, res) => {
  const cb = () => {
    models.Shipping_Address
      .findAll({
        where: { UserId: req.session.user.id  }
      })
      .then(addresses => res.json({
        addresses
      }))
      .catch((err) => {
        handleDBError(err, res);
      });
  };

  checkPermissions(req, res, 0, null, cb);
});

// GET /users/{id} - only the user or admin can access
router.get('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined) return notProvidedError(res, 'id');
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
        handleDBError(err, res);
      });
  }

  checkPermissions(req, res, null, id, cb);

})

router.put('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined) return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {
    models.User
      .findOne({
        where: {
          id
        }
      })
      .then((user) => {

        const b = req.body;

        // only allows for updating the first_name, last_name, email,
        // and password fields
        const userObj = {
          first_name: b.first_name || user.first_name,
          last_name: b.last_name || user.last_name,
          email: b.email || user.email,
          password: b.password || user.password
        };

        models.User
          .update(userObj, {
            where: {
              id: user.id
            }
          })
          .then((success) => {
            res.json({
              success: true
            });
          })
          .catch((err) => {
            handleDBError(err, res);
          });

      })
      .catch((err) => {
        handleDBError(err, res);
      })
  }

  checkPermissions(req, res, null, id, cb);

});

router.delete('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined) return notProvidedError(res, 'id');
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
            handleDBError(err, res);
          });
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  checkPermissions(req, res, null, id, cb);

});

module.exports = router;
