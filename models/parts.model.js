'use strict';

module.exports = (sequelize, DataTypes) => {
    var Part = sequelize.define('Part', {
        number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cost: {
          type: DataTypes.FLOAT,
          allowNull: true
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
      classMethods: {
        associate: (models) => {
           Part.belongsToMany(models.Parts_Category, {through: 'PartCategory'});
          //  Part.hasMany(models.Order_Detail);
        }
      }
    });

    return Part;
};
