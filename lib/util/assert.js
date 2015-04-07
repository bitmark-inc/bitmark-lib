var _ = require('lodash');

module.exports = function(condition, throwObject) {
  if (!condition) {
    if (_.isError(throwObject)) {
      throw throwObject;
    } else {
      throw new Error(throwObject);
    }
  }
};