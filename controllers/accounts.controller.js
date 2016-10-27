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

module.exports = router;