const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const ParseCookies = require('./middleware/cookieParser')
const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from ../public directory
app.use(express.static(path.join(__dirname, '../public')));

app.use(ParseCookies);
app.use(Auth.createSession);


app.get('/', Auth.verifySession,
(req, res) => {
    res.render('index');
});

app.get('/create', Auth.verifySession,
(req, res) => {
  res.render('index');
});

app.get('/links', Auth.verifySession,
(req, res, next) => {
  console.log("GET LINK, session:", req.session);
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  console.log("POST LINK",req.body.url);
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    console.log("NOT VAILD")
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/signup', (req, res) => {
  res.render('signup');
})

app.post('/signup',
(req, res, next) => {
  var hashedPassword = utils.hashing(req.body.password);
  req.body.password = hashedPassword;
  var username = req.body.username;

  return models.Users.get({username})
    .then(user => {
      if (user) {
        throw user;
      }
      return models.Users.create({username, hashedPassword});
    })
    .then(results => {
      return models.Sessions.update({ hash: req.session.hash }, { user_id: results.insertId });
    })
    .then(() => {
      res.redirect('/');
    })
    .catch(() => {
      res.redirect('/signup');
    });
});

app.get('/login', (req, res) => {
  res.render('login');
}) 

app.post('/login',
(req, res, next) => {
  var hashedPassword = utils.hashing(req.body.password);
  
  return models.Users.get({ username: req.body.username })
    .then(user => {
      console.log('SUCCESS: ', user);
      if (user === undefined) {
        throw err;
      }
      if (user.password !== hashedPassword) {
        throw err;
      }
      return models.Sessions.update({ hash: req.session.hash }, { user_id: user.id });
    })
    .then(() => {
      res.redirect('/');
    })
    .catch(() => {
      res.redirect('/login');
    });
});

app.get('/logout', (req, res, next) => {

  return models.Sessions.delete({ hash: req.cookies.shortlyid })
    .then(() => {
      res.clearCookie('shortlyid');
      res.redirect('/login');
    })
    .error(error => {
      res.status(500).send(error);
    });
});
/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {
      console.log("SHORRRRRRTERRRR CODE", req.session);
  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
