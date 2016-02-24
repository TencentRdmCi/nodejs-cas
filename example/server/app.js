'use strict';

/**
 * Module dependencies
 */

var express = require('express'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  errorHandler = require('error-handler'),
  morgan = require('morgan'),
  path = require('path'),
  url = require('url'),
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  cas = require('../../index.js'),
  config = require('./config');

var MemoryStore = require('session-memory-store')(session);


var app = module.exports = express();

/**
 * Configuration
 */

  // all environments
app.set('port', config.servicePort);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//app.use(express.static(path.resolve(__dirname, '../public')));

app.use(morgan('dev'));

app.use(cookieParser());

// 因为要ssout，所以不能用cookie-session因为根本找不到
// app.use(cookieSession({
//    key: 'JSESSION',
//    secret: 'hello world'
// }));
app.use(session({
  name: 'NSESSIONID',
  secret: 'Hello I am a long long long secret',
  store: new MemoryStore()
}));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

var env = process.env.NODE_ENV || 'development';

// development only
if (env === 'development') {
  //app.use(errorHandler());
}

// production only
if (env === 'production') {
  // TODO
}

///////////////////////////////////////////
//            CAS Config begin
///////////////////////////////////////////
var casServiceObj = url.parse(config.casServicePrefix);

cas.configure({
  host: casServiceObj.host,
  hostname: casServiceObj.hostname,
  protocol: 'http',
  port: 80,
  paths: {
    validate: '/cas/validate',
    serviceValidate: '/cas/serviceValidate',
    proxy: '/cas/proxy',
    login: '/cas/login',
    logout: '/cas/logout'
  }
});

app.use(cas.serviceValidate({
  pgtUrl: '/cas/proxyCallback'
}))
  .use(cas.ssout('/cas/validate'))
  .use(cas.authenticate());

app.get('/logout', function (req, res) {
  if (!req.session) {
    return res.redirect('/');
  }
  // Forget our own login session

  if (req.session.destroy) {
    req.session.destroy();
  }
  else {
    // Cookie-based sessions have no destroy()
    req.session = null;
  }
  // Send the user to the official campus-wide logout URL
  var options = cas.configure();
  options.pathname = options.paths.logout;
  options.query = {
    service: config.servicePrefix
  };
  return res.redirect(url.format(options));
});


/**
 * Routes
 */

var router = require('./routes/router.js')(app);
