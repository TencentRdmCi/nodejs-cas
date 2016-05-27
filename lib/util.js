var qs = require('querystring');
var url = require("url");

module.exports.origin = function(req, options) {
  var query = req.query;
  if (query.ticket) delete query.ticket;
  var querystring = qs.stringify(query);
  if (!options) {
    throw new Error('no options!!!');
  }

  return options.servicePrefix + url.parse(req.originalUrl).pathname + (querystring ? '?' + querystring : '');
};

module.exports.checkIgnoreRule = function(req, rules, path) {
  if (rules && rules.splice && rules.length) {
    return rules.some(function(rule) {
      if (typeof rule === 'string') {
        return path.indexOf(rule) > -1;
      } else if (rule instanceof RegExp) {
        return rule.test(path);
      } else if (typeof rule === 'function') {
        return rule(path, req);
      }
    });
  } else {
    return false;
  }
}