const utils = require('../lib/hashUtils');
const Model = require('./model');

// Write you user database model methods here

class Users extends Model {
  constructor() {
    super('users');
  }
}

module.exports = new Users();