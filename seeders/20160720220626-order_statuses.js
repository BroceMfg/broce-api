'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Order_Statuses', [
      {
        current: true,
        StatusTypeId: 1,
        OrderId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: false,
        StatusTypeId: 1,
        OrderId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: true,
        StatusTypeId: 2,
        OrderId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: false,
        StatusTypeId: 1,
        OrderId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: false,
        StatusTypeId: 2,
        OrderId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: true,
        StatusTypeId: 3,
        OrderId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: false,
        StatusTypeId: 1,
        OrderId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: false,
        StatusTypeId: 2,
        OrderId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: false,
        StatusTypeId: 3,
        OrderId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        current: true,
        StatusTypeId: 4,
        OrderId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Order_Statuses', null, {});
  }
};
