'use strict';

module.exports = (sequelize, DataTypes) => {
    var Notification = sequelize.define('Notification', {
        OrderId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        StatusTypeId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        new: {
          type: DataTypes.BOOLEAN,
          allowNull: true
        }
    }, {
      classMethods: {
        associate: (models) => {
          Notification.belongsTo(models.Order);
          Notification.belongsTo(models.Status_Type);
        }
      }
    }, {
       tableName: 'notifications'
    });

    return Notification;
};
