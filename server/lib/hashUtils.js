const crypto = require('crypto');

/************************************************************/
// Add any hashing utility functions below
/************************************************************/

module.exports.hashing = function(password) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}


module.exports.compareHash = function(attemped, stored) {
  return stored === this.hashing(attemped);
}
