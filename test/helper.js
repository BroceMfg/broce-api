const chai = require('chai');
const chaiHTTP = require('chai-http');

chai.use(chaiHTTP);

// takes an array of db models, an optional callback, and an optional current index
const deleteModels = (models, cb, i) => {
  i = i || 0;
  models[i]
    .findAll({})
    .then((items) => {
      items.forEach((item) => {
        item.destroy();
      });
      if (i === (models.length - 1)) return cb ? cb() : true;
      else return deleteModels(models, cb, i + 1);
    })
    .catch((err) => {
      console.log(err.stack);
      throw err;
    });
}

// takes an array of objects (see next comment), an optional callback, an optional current index
// each object will contain the model itself and an object of dummy data in the format:
// { model: <dbModel>, obj: <dataObj> }
const createModels = (models, cb, i) => {
  i = i || 0;
  models[i].model
    .create(models[i].obj)
    .then((success) => {
      if (i === (models.length - 1)) return cb ? cb() : true;
      else return createModels(models, cb, i + 1);
    })
    .catch((err) => {
      console.log(err.stack);
      throw err;
    });
}

module.exports = {
  deleteModels,
  createModels
};
