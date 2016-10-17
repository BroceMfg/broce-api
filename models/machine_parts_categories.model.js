'use strict';

module.exports = (sequelize, DataTypes) => {
    var Parts_Category = sequelize.define('Parts_Category', {
        model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        serial_min: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        serial_max: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    },{
      classMethods: {
        associate: (models) => {
          Parts_Category.belongsToMany(models.Part, {through: 'PartCategory'});
        }
      }
    }, {
       tableName: 'parts_categories'
    });

    return Parts_Category;
};
