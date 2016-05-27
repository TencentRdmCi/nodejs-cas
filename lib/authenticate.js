var origin = require('./util').origin;
var _ = require('lodash');
var checkIgnoreRule = require('./util').checkIgnoreRule;
var queryString = require('query-string');

module.exports = function(options) {
  var debug = !!options.debug;

  return function(req, res, next) {
    if (options.ignore && options.ignore.length) {
      if (checkIgnoreRule(req, options.ignore, req.path)) return next();
    }

    if (req.session && req.session.st) {
      if ((options.paths.proxyCallback && req.session.pgt) || !options.paths.proxyCallback) {
        return next();
      } else {
        if (debug) {
          if (options.paths.proxyCallback && !req.session.pgt) {
            console.log('Using proxy-mode CAS, but pgtId is not found in session.');
          }
        }
      }
    } else {
      if (debug) {
        console.log('Can not find st in session', req.session);
      }
    }
    // 找不到session/st，跳到login

    // 先将之前原始路径存在session
    req.session.lastUrl = origin(req, options);

    req.session.save();

    var params = {};

    params.service = options.servicePrefix + options.paths.validate;

    if (options.params) {
      _.extend(params, options.params);
    }

    if (options.ajaxHeader && req.get(options.ajaxHeader)) {
      console.log('Need to redirect, but matched AJAX request, send 418');
      res.status(418).send({ message: 'Login status expired, need refresh path' });
    } else {
      var loginPath = options.path + options.paths.login + '?' + queryString.stringify(params);
      console.log('redirect to login page ', loginPath);
      res.redirect(302, loginPath);
    }
  };
};
