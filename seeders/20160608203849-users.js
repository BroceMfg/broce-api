'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users', [
      {
        first_name: 'Ray',
        last_name: 'Bray',
        email: 'ray@brocebroom.com',
        password: '$2a$08$WDRgosAz6nnR85KNGpT5aekCoMXVtbXcHnDo4JfdN248FW6vbla/6',
        role: 'admin',
        AccountId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        first_name: 'Dave',
        last_name: 'DealerDude',
        email: 'dave@dealerdude.com',
        password: '$2a$08$6WmwCXMPnXTrwlDjXgEpSupuvvWu7vsNONZoHQMgZBhm7wA.VkCPC',
        role: 'standard',
        AccountId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        first_name: 'Bob',
        last_name: 'Taylor',
        email: 'bob@thetaylors.com',
        password: '$2a$08$uWwXCs/lNnZKSIZ5OFsJSueqPpb8qWVPPrjHyZ20W5ZHldCa7C3/W',
        role: 'standard',
        AccountId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
