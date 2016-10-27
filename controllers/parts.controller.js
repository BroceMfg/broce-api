const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const normalizeNumberString = require('./helpers/normalizeNumberString');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBFindErrorAndRespondWithAppropriateJSON = require('./helpers/handleDBFindErrorAndRespondWithAppropriateJSON');

// GET /parts
router.get('/', (req, res) => {

  const cb = () => {

    models.Part
      .findAll({})
      .then((parts) => {
        res.json({
          parts
        });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
      });

  }

  // checkPermissions with userRole = 0 means any authenticated user can GET
  checkPermissions(req, res, 0, null, cb);

});

module.exports = router;