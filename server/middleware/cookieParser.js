const parseCookies = (req, res, next) => {
  // console.log("BEFORE COOKIE PARSE, req.headers.cookie", req.headers.cookie);
  var cookiesObj = {};
  if (req.headers.cookie) {
    var cookiesArray = req.headers.cookie.split(';');
    cookiesArray.forEach((cookieString) => {
      var keyValuePair = cookieString.split('=');
      cookiesObj[keyValuePair[0].trim()] = keyValuePair[1].trim();
    });
  }
  req.cookies = cookiesObj;
  // console.log("AFTER COOKIE PARSE, req.cookies", req.cookies);
  next();
};
module.exports = parseCookies;