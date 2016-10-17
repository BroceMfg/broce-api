'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Status_Types', [
      {
        status: 'quote',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        status: 'priced',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        status: 'ordered',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        status: 'shipped',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Status_Types');
  }
};
