/**
 * @File 验证ticket，拿ptgid，处理proxyCallback等操作
 *
 */

var origin = require('./util').origin;
var _ = require('lodash');
var parseUrl = require('url').parse;
var formatUrl = require('url').format;
var request = require('request');
var xml2js = require('xml2js').parseString;
var stripPrefix = require('xml2js/lib/processors').stripPrefix;

module.exports = function (overrides) {
  var configuration = require('./configure')();
  var options = _.extend({}, overrides, configuration);

  var pgtPathname = pgtPath(options);

  /**
   * 仅当/cas/proxyCallback 和/cas/validate 两个请求会被响应，/cas/validate必须带ticket，否则也会next
   * 其余都会next
   */
  return function (req, res, next) {

    if (!options.host && !options.hostname) throw new Error('no CAS host specified');
    if (options.pgtFn && !options.pgtUrl) throw new Error('pgtUrl must be specified for obtaining proxy tickets');

    // 强制需要提供sessionStore的实现
    if (!req.sessionStore) throw new Error('Session store is required!');

    if (!req.session) {
      res.send(503);
      return;
    }

    var url = parseUrl(req.url, true);
    var ticket = (url.query && url.query.ticket) ? url.query.ticket : null;

    options.query = options.query || {};
    options.query.service = origin(req);
    options.query.ticket = ticket;
    options.pathname = options.paths.serviceValidate;

    if (options.pgtUrl || options.query.pgtUrl) {
      options.query.pgtUrl = pgtPathname ? req.protocol + '://' + req.get('host') + pgtPathname :
                             options.pgtUrl;
    }

    // 用于cas server回调时，设置pgtIou -> pgtId的键值对，用于后面校验
    if (pgtPathname && req.path === pgtPathname && req.method === 'GET') {

      if (!req.query.pgtIou || !req.query.pgtId) {

        return res.send(200);
      }

      // TODO: 需要提供快速过期的实现
      req.sessionStore.set(req.query.pgtIou, _.extend(req.session, {
        pgtId: req.query.pgtId
      }));

      return res.send(200);
    }

    // 没ticket，下一步authenticate
    if (!ticket && req.path !== options.paths.validate) {
      next();
      return;
    }

    // 带ticket的话，校验ticket
    // Have I already validated this ticket?
    req.sessionStore.get(req.session.id, function (err, storedSession) {
      if (storedSession && storedSession.st && (storedSession.st === ticket)) {
        return next();
      }
      else {
        validateService(res, formatUrl(options), function (casBody) {
          validateCasResponse(req, res, ticket, casBody, options, next);
        });
      }

    });
    // cookie session

  };
};

/**
 * 校验ticket
 *
 * @param res
 * @param url
 * @param callback
 */
function validateService(res, url, callback) {
  request.get(url, function (casErr, casRes, casBody) {
    if (casErr || casRes.statusCode !== 200) {
      res.send(403);
      return;
    }
    callback(casBody);
  });

}

/**
 * 解析cas返回的xml，并做相应处理
 *
 * @param req
 * @param res
 * @param ticket
 * @param casBody
 * @param options
 * @param next
 */
function validateCasResponse(req, res, ticket, casBody, options, next) {

  xml2js(casBody, {
    explicitRoot: false,
    tagNameProcessors: [stripPrefix]
  }, function (err, serviceResponse) {
    if (err) {
      console.error('Failed to parse CAS server response. (' + err.message + ')');
      res.send(500);
      return;
    }

    var success = serviceResponse && serviceResponse.authenticationSuccess && serviceResponse.authenticationSuccess[0],
      user = success && success.user && success.user[0],
      pgtIou = success && success.proxyGrantingTicket && success.proxyGrantingTicket[0];

    if (!serviceResponse) {
      console.error('Invalid CAS server response.');
      res.send(500);
      return;
    }

    if (!success) {
      next();
      return;
    }
    req.session.st = ticket;

    if (req.ssoff) {
      req.sessionStore.set(ticket, {sid: req.session.id});
    }

    req.session.cas = {};
    for (var casProperty in success) {
      if (casProperty != 'proxyGrantingTicket')
        req.session.cas[casProperty] = success[casProperty][0];
    }

    if (!pgtIou) {
      //next();
      res.redirect(302, req.session.lastUrl);
      return;
    }

    retrievePGTFromPGTIOU(req, res, pgtIou);
  });
}

function retrievePGTFromPGTIOU(req, res, pgtIou) {
  req.sessionStore.get(pgtIou, function (err, session) {

    if (err) {
      req.sessionStore.destroy(pgtIou);
      res.send(401);
      return;
    }

    req.session.pgt = session.pgtId;

    // 释放
    req.sessionStore.destroy(pgtIou);

    res.redirect(302, req.session.lastUrl);
  });

}
// returns false or the relative pathname to handle
function pgtPath(options) {
  var pgtUrl = parseUrl(options.pgtUrl || (options.query ? options.query.pgtUrl : ''));
  if (pgtUrl.protocol === 'http:') throw new Error('callback must be secured with https');
  if (pgtUrl.protocol && pgtUrl.host && options.pgtFn) return false;
  return pgtUrl.pathname;
}
