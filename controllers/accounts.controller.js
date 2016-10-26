const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBFindErrorAndRespondWithAppropriateJSON = require('./helpers/handleDBFindErrorAndRespondWithAppropriateJSON');

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
        handleDBFindErrorAndRespondWithAppropriateJSON(err);
      });
  }

  checkPermissions(req, res, 1, null, cb);

});

module.exports = router;