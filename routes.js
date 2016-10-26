const router = require('express').Router();
const models = require('./models');
const ordersController = require('./controllers/orders.controller.js');
const usersController = require('./controllers/users.controller.js');
const accountsController = require('./controllers/accounts.controller.js');

// GET / - default
router.get('/', (req, res) => {

  res.json({
    title: 'Broce Parts API'
  });
  
});

router.use('/orders', ordersController);
router.use('/users', usersController);
router.use('/accounts', accountsController);

module.exports = router;