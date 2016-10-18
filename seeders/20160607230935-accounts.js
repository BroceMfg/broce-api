'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Accounts', [
      {
        account_name: 'broce_parts',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        account_name: 'CAT Dealers',
        billing_address: '123 Main St',
        billing_city: 'Springfield',
        billing_state: 'MO',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Accounts', null, {});
  }
};
