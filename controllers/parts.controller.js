const router = require('express').Router();
const models = require('../models');
const notProvidedError = require('./helpers/notProvidedError');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const normalizeNumberString = require('./helpers/normalizeNumberString');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBError = require('./helpers/handleDBError');

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
        handleDBError(err, res);
      });

  }

  // checkPermissions with userRole = 0 means any authenticated user can GET
  checkPermissions(req, res, 0, null, cb);

});

// GET /parts/{id}
router.get('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {
  
    models.Part
      .findOne({
        where: {
          id
        }
      })
      .then((part) => {
        res.json({
          part
        });
      })
      .catch((err) => {
        handleDBError(err, res);
      });

  }

  checkPermissions(req, res, 0, null, cb);

});

// POST /parts + form - ADMIN ONLY
router.post('/', (req, res) => {

  const cb = () => {

    // check to make sure all required form fields exist
    if (!req.body.number)
      return notProvidedError(res, 'number');
    if (!req.body.description)
      return notProvidedError(res, 'description');
    if (!req.body.cost)
      return notProvidedError(res, 'cost');
    if (!req.body.image_url)
      return notProvidedError(res, 'image_url');

    const partForm = {
      number: req.body.number,
      description: req.body.description,
      cost: req.body.cost,
      image_url: req.body.image_url
    };

    models.Part
      .create(partForm)
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        handleDBError(err, res);
      });

  }

  // checkPermissions with userRole=1 means only admin has access
  checkPermissions(req, res, 1, null, cb);

});

// PUT /parts/{id} + form - ADMIN ONLY
router.put('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {

    models.Part
      .findOne({
        where: {
          id
        }
      })
      .then((part) => {
        cb2(part);
      })
      .catch((err) => {
        handleDBError(err, res);
      });

  }

  const cb2 = (part) => {

    const b = req.body;

    // only allows for updating the number, description,
    // cost, and image_url
    const partObj = {
      number: b.number || part.number,
      description: b.description || part.description,
      cost: b.cost || part.cost,
      image_url: b.image_url || part.image_url
    };

    models.Account
      .update(partObj, {
        where: {
          id: part.id
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

  }

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// DELETE /parts/{id} - ADMIN ONLY
router.delete('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = () => {

    models.Part
      .findOne({
        where: {
          id
        }
      })
      .then((part) => {
        part.destroy({ force: true })
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

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

module.exports = router;