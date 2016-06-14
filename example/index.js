var path = require('path');
var Express = require('express');
var session = require('express-session');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
// import flash = 'express-flash';
var CasClient = require('../index');
var ejs = require('ejs');
// import ejs from 'ejs';

var app = new Express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('here is some secret'));

var MemoryStore = require('session-memory-store')(session);

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'I am a secret',
  name: 'jssessionid',
  store: new MemoryStore()
}));

app.engine('.html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, './views'));

// CAS config
// =============================================================================
var casClient = new CasClient({
  debug: true,
  path: 'http://rdmdev.oa.com',
  paths: {
    validate: '/cas/node-cas',
    serviceValidate: '/buglycas/serviceValidate',
    proxy: '/buglycas/proxy',
    login: '/buglycas/login',
    logout: '/buglycas/logout',
    proxyCallback: '/buglycas/proxyCallback'
  },
  servicePrefix: 'http://10.17.86.87:8080',
  ajaxHeader: 'x-client-fetch',
  redirect: function(req, res) {
    if (req.cookies && req.cookies.d) {
    }
  },
  ignore: [
    function(path, req) {
    },
    /^\/api\/download\/.*\/(info|url)$/,
    'api/img/icon',
    '/login',
    /^\/api\/download\/pkg\/.*$/,
    'api/qr',
    'report/page'
  ],
});

app.use(casClient.serviceValidate()) // 传入注册时的service, 用于全局登出
  .use(casClient.ssoff())
  .use(casClient.authenticate());

app.get('/', function(req, res) {
  res.render('index.ejs');
});

app.get('/logout', function(req, res) {
  if (!req.session) {
    return res.redirect('/');
  }
  // Forget our own login session

  if (req.session.destroy) {
    req.session.destroy();
  } else {
    // Cookie-based sessions have no destroy()
    req.session = null;
  }

// Send the user to the official campus-wide logout URL
  const options = cas.options;

  return res.redirect(options.path + options.paths.logout + '?service=' + encodeURIComponent(options.servicePrefix + options.paths.validate));
});


app.listen(8080, function(err) {
  if (err) throw err;
  console.log('App is now listening to port 8080.');
});