'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Parts', [
      {
        number: 'F-201-R',
        description: 'Main Frame w/ Decking',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: 'VF-319-RA',
        description: 'Catch Assembly (Complete)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: 'F-811-R',
        description: 'Rock Guard',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Parts', null, {});
  }
};
