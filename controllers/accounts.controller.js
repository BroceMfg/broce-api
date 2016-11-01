const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const normalizeNumberString = require('./helpers/normalizeNumberString');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBFindErrorAndRespondWithAppropriateJSON = require('./helpers/handleDBFindErrorAndRespondWithAppropriateJSON');

// GET /accounts - ADMIN ONLY
router.get('/', (req, res) => {
  
  const cb = () => {
    models.Account
      .findAll({})
      .then((accounts) => {
        res.json({
          accounts
        });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
      });
  }

  checkPermissions(req, res, 1, null, cb);

});

// POST /accounts - ADMIN ONLY
router.post('/', (req, res) => {

  const cb = () => {

    // check to make sure all required form fields exist
    if (!req.body.account_name)
      return notProvidedFieldErrorResponse(res, 'account_name');
    if (!req.body.billing_address)
      return notProvidedFieldErrorResponse(res, 'billing_address');
    if (!req.body.billing_city)
      return notProvidedFieldErrorResponse(res, 'billing_city');
    if (!req.body.billing_state)
      return notProvidedFieldErrorResponse(res, 'billing_state');

    const newAccount = {
      account_name: req.body.account_name,
      billing_address: req.body.billing_address,
      billing_city: req.body.billing_city,
      billing_state:req.body.billing_state,
    };

    models.Account
      .create(newAccount)
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        console.log(err.stack);
        res.status(500).json({
          success: false,
          error: process.env.NODE_ENV !== 'production' 
              ? err.message : 'internal server error'
        });
        throw err;
      });

  }

  // check permission for userRole = 1 means only admins can post
  checkPermissions(req, res, 1, null, cb);

});

// GET /accounts/{id} - Member or Admin Only
router.get('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined) return notProvidedFieldErrorResponse(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (accountId) => {

    models.Account
      .findOne({
        where: {
          id: normalizeNumberString(accountId)
        }
      })
      .then((account) => {
        res.json({
          account
        });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
      });

  }

  const userId = process.env.NODE_ENV === 'test' ? 
    require('./helpers/checkPermissions/getUserId.test')(req) : 
    normalizeNumberString(req.session.user.id);

  if (userId == undefined) {
    return res.status(403).json({
      success: false,
      message: 'error: no user data found'
    });
  }

  models.User
    .findOne({
      where: {
        id: userId
      }
    })
    .then((user) => {
      if (user == undefined || user.AccountId == undefined) {
        handleDBFindErrorAndRespondWithAppropriateJSON(
          new Error('no account id',
            'user does not contain a AccountId property'), res);
      } else if (normalizeNumberString(user.role) === 1) {
        cb(id);
      } else if (user.AccountId === id) {
        cb(id);
      }
      else {
        return require('./helpers/permissionDenied')(res);  
      }
    })
    .catch((err) => {
      console.log('hepfqiowe');
      handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
    });

});

// PUT /accounts/{id} - ADMIN ONLY
router.put('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedFieldErrorResponse(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {

    models.Account
      .findOne({
        where: {
          id
        }
      })
      .then((account) => {
        cb2(account);
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
      });

  }

  const cb2 = (account) => {

    const b = req.body;

    // only allows for updating the account_name, billing_address,
    // billing_city, and billing_state
    const accountObj = {
      account_name: b.account_name || account.account_name,
      billing_address: b.billing_address || account.billing_address,
      billing_city: b.billing_city || account.billing_city,
      billing_state: b.billing_state || account.billing_state
    };

    models.Account
      .update(accountObj, {
        where: {
          id: account.id
        }
      })
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
      });

  }

  checkPermissions(req, res, 1, null, cb);

});

// DELETE /acounts/{id} - ADMIN ONLY
router.delete('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedFieldErrorResponse(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {

    models.Account
      .findOne({
        where: {
          id
        }
      })
      .then((account) => {
        account.destroy({ force: true })
          .then((success) => {
            res.json({
              success: true
            });
          })
          .catch((err) => {
            handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
          });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
      });

  }

  checkPermissions(req, res, 1, null, cb);

});

module.exports = router;