'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('PartCategory', [
      {
        PartId: 1,
        PartsCategoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        PartId: 2,
        PartsCategoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        PartId: 3,
        PartsCategoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('PartCategory', null, {});
  }
};
