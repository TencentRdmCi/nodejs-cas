/**
 * 单点登出
 */

var _ = require('lodash');

/**
 * 如果指定了特殊serviceUrl, 那么以这个url来判断CAS发起过来的单点登出的请求
 * 否则使用默认的paths.validate的路径
 *
 * @param serviceUrl
 * @param options
 * @returns {Function}
 */
module.exports = function(options, serviceUrl) {
  return function(req, res, next) {
    if (!req.sessionStore) throw new Error('no session store configured');
    serviceUrl = serviceUrl || options.paths.validate;

    req.ssoff = true;
    if (req.method !== 'POST' || req.url !== serviceUrl) {
      next();
      return;
    }
    var body = '';
    req.on('data', function(chunk) {
      body += chunk;
    });
    req.on('end', function() {
      if (!/<samlp:SessionIndex>(.*)<\/samlp:SessionIndex>/.exec(body)) {
        next();
        return;
      }
      var st = RegExp.$1;

      req.sessionStore.get(st, function(err, result) {
        if (err) {
          console.error('Trying to ssoff, but get st from session failed!');
          console.error(err);
          return;
        }

        if (result && result.sid) req.sessionStore.destroy(result.sid);
        req.sessionStore.destroy(st);
      });
      res.send(204);
    });
  }
}
