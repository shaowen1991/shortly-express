const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // console.log("####Create Session with Cookie:######", req.cookies);
  var current_date = (new Date()).valueOf().toString();
  var random = Math.random().toString();
  var agent = current_date + random;

  Promise.resolve(req.cookies.shortlyid)
    .then(hash => {
      //if there is no cookie
      if (!hash) {
        throw hash;
      }
      return models.Sessions.get({hash});
    })
    //tap means do the things in block, but not return anything from it
    //so the next then will get the return data from above
    .tap(session => {
      //if no such session
      if (!session) {
        throw session;
      }
      // verify token; if invalid, throw to create new session
      if (!models.Sessions.compare(agent, session.hash)) {
        return models.Sessions.delete({hash: session.hash})
          .throw(agent);
      }
    })
    //initialize session
    .catch(() => {
      //create a new session record in db, with only hash in
      return models.Sessions.create({agent})
        .then(results => {
          //after create, retrieve the record, 
          //add user_id in it in Session class
          return models.Sessions.get({id: results.insertId})
        })
        .tap(session => {
          res.cookie('shortlyid', session.hash);
        });
    })
    .then(session => {
      req.session = session;
      next();
    });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  
  if (!models.Sessions.isLoggedIn(req.session)) {
    console.log('NOT VERIFYED!!!!', req.body);
    res.redirect('/login');
  } 
  else {
    next();
  }
}
