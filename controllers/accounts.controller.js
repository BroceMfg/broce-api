const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBFindErrorAndRespondWithAppropriateJSON = require('./helpers/handleDBFindErrorAndRespondWithAppropriateJSON');

router.get('/', (req, res) => {
  
  res.json({
    hello: 'world'
  });

});

module.exports = router;