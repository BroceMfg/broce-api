'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Shipping_Options', [
      {
        option: 'FedEx Air',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        option: 'FedEx 2nd Day',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        option: 'FedEx Early AM',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        option: 'UPS Ground',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Shipping_Options', null, {});
  }
};
