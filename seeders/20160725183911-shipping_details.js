'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Shipping_Details', [
      {
        tracking_number: '012384QT701L4512FJ63',
        cost: 73.28,
        UserId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Shipping_Details', null, {});
  }
};
