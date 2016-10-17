'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Parts_Categories', [
      {
        model: '350',
        serial_min: 408094,
        serial_max: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        model: '350',
        serial_min: 407638,
        serial_max: 408093,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Parts_Categories', null, {});
  }
};
