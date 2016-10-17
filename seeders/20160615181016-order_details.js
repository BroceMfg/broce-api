'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Order_Details', [
      {
        machine_serial_num: 407638,
        quantity: 2,
        part_number: 'RX-019234',
        price: null,
        OrderId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 305322,
        quantity: 1,
        part_number: 'AV-097412',
        price: null,
        OrderId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 307412,
        quantity: 1,
        part_number: 'B0936172',
        price: 27.12,
        OrderId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 307412,
        quantity: 1,
        part_number: '009732-sd',
        price: 9.80,
        OrderId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 406974,
        quantity: 3,
        part_number: '109712',
        price: 11.73,
        OrderId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 500127,
        quantity: 1,
        part_number: '751241',
        price: 71.23,
        OrderId: 3,
        ShippingOptionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 500127,
        quantity: 1,
        part_number: '004712-H',
        price: 16.03,
        OrderId: 3,
        ShippingOptionId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 304651,
        quantity: 1,
        part_number: '070212',
        price: 56.60,
        OrderId: 4,
        ShippingOptionId: 2,
        ShippingDetailId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        machine_serial_num: 406821,
        quantity: 4,
        part_number: 'B00882',
        price: 6.03,
        OrderId: 4,
        ShippingOptionId: 2,
        ShippingDetailId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Order_Details', null, {});
  }
};
