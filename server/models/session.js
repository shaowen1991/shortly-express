const utils = require('../lib/hashUtils');
const Model = require('./model');
const Users = require('./user');
// Write you session database model methods here

class Sessions extends Model {
  constructor() {
    super('sessions');
  }
  isLoggedIn(session) {
    return !!session.user_id
  }

  compare(agent, stored) {
    return utils.compareHash(agent, stored);
  }

  get(options) {
    return super.get.call(this, options)
      .then(session => {
        //session or session.user_id is undefined
        if (!session || !session.user_id) {
          return session;
        }
        return Users.get({id: session.user_id})
          .then(user => {
      
            session.username = user.username;

            console.log("session username", session);
            return session;
          });
      });
  }

  create({ agent }) {
    // console.log("AGENT:", agent);
    var hash = utils.hashing(agent);
    // console.log("HASH:", hash);
    return super.create.call(this, { hash });
  }
}

module.exports = new Sessions();