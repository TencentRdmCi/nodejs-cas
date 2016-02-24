var origin = require('./util').origin;
var url = require('url');
var _ = require('lodash');

module.exports = function (overrides) {
  var configuration = require('./configure')();
  var options = _.extend({}, overrides, configuration);
  return function (req, res, next) {
    if (req.session && req.session.st) {
      // refresh the expiration if ssout
      if (req.ssout) {
        req.sessionStore.set(req.session.st, req.session.id);
      }

      next();
      return;
    }
    // 找不到session/st，跳到login

    // 先将之前原始路径存在session
    req.session.lastUrl = origin(req);

    req.session.save();

    options.pathname = options.paths.login;
    options.query = options.query || {};
    options.query.service = req.protocol + '://' + req.get('host') + options.paths.validate;

    res.redirect(302, url.format(options));
  };
};
