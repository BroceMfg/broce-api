'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Orders', [
      {
        shipping_address: null,
        shipping_city: null,
        shipping_state: null,
        shipping_zip: null,
        po_number: null,
        UserId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        shipping_address: null,
        shipping_city: null,
        shipping_state: null,
        shipping_zip: null,
        po_number: null,
        UserId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        shipping_address: '123 Main St',
        shipping_city: 'Winter Park',
        shipping_state: 'FL',
        shipping_zip: 32792,
        po_number: '30197134',
        UserId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        shipping_address: '405 Washington St',
        shipping_city: 'Omaha',
        shipping_state: 'NE',
        shipping_zip: 68022,
        po_number: '10975732',
        UserId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Orders', null, {});
  }
};
