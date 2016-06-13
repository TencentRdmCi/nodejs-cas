/**
 * @File 验证ticket，拿ptgid，处理proxyCallback等操作
 *
 */

var checkIgnoreRule = require('./util').checkIgnoreRule;
var _ = require('lodash');
var parseUrl = require('url').parse;
var queryString = require('query-string');
var fetch = require('node-fetch');
var xml2js = require('xml2js').parseString;
var stripPrefix = require('xml2js/lib/processors').stripPrefix;
var debug = false;

module.exports = function(options) {
  debug = !!options.debug;

  var pgtCallbackUri = parseUrl(options.paths.proxyCallback || '');

  var pgtPathname = pgtCallbackUri.pathname;

  /**
   * 仅当/cas/proxyCallback 和/cas/validate 两个请求会被响应，/cas/validate必须带ticket，否则也会next
   * 其余都会next
   */
  return function(req, res, next) {

    if (!options.path) throw new Error('CAS server path is not specified.');
    if (!options.servicePrefix) throw new Error('No servicePrefix specified.');

    // 强制需要提供sessionStore的实现
    if (!req.sessionStore) throw new Error('Session store is required!');

    if (!req.session) {
      console.error('service-validate, req.session is undefined!');
      res.status(503).send({
        message: 'service-validate, req.session is undefined!'
      });
      return;
    }

    var url = parseUrl(req.url, true);

    if (options.ignore && options.ignore.length) {
      if (checkIgnoreRule(req, options.ignore, req.path)) {
        console.log('Match ignore rule, jump through CAS authentication.');
        return next();
      }
    }

    var ticket = (url.query && url.query.ticket) ? url.query.ticket : null;

    // options.query = options.query || {};
    // // options.query.service = origin(req);
    // options.query.service = origin(req, options);
    // options.query.ticket = ticket;
    // options.pathname = options.paths.serviceValidate;

    var params = {};
    params.service = options.servicePrefix + options.paths.validate;
    params.ticket = ticket;

    if (options.paths.proxyCallback) {
      if (debug) {
        console.log('pgtUrl is specific(' + options.paths.proxyCallback + '), CAS using proxy mode.');
      }

      params.pgtUrl = (pgtCallbackUri.protocol && pgtCallbackUri.host) ? options.paths.proxyCallback : (options.servicePrefix + options.paths.proxyCallback);

      console.log('params.pgtUrl', params.pgtUrl);
    } else {
      if (debug) {
        console.log('pgtUrl is not specific, CAS using none-proxy mode.');
      }
    }

    // 用于cas server回调时，设置pgtIou -> pgtId的键值对，用于后面校验
    if (pgtPathname && req.path === pgtPathname && req.method === 'GET') {
      if (debug) {
        console.log('Receiving pgtIou from CAS server.');
        console.log('req.path', req.path);
        console.log('pgtPathname', pgtPathname);
        console.log('req.query', req.query);
      }

      if (!req.query.pgtIou || !req.query.pgtId) {
        if (debug) {
          console.log('Receiving pgtIou from CAS server, but with unexpected pgtIou: ' + req.query.pgtIou + ' or pgtId: ' + req.query.pgtId);
        }
        return res.sendStatus(200);
      }

      // TODO: 需要提供快速过期的实现
      return req.sessionStore.set(req.query.pgtIou, _.extend(req.session, {
        pgtId: req.query.pgtId
      }), function(err) {
        if (err) {
          console.log('Error happened when trying to store pgtIou in sessionStore.');
          console.error(err);

          return res.status(500).send({
            message: 'Error happened when trying to store pgtIou in sessionStore.',
            error: err
          });
        }

        if (debug) {
          console.log('Receive and store pgtIou together with pgtId succeed!');
        }

        res.sendStatus(200);
      });
    }

    // 没ticket，下一步authenticate
    if (!ticket && req.path !== options.paths.validate) {
      next();
      return;
    }

    if (debug) {
      console.log('Start trying to valid ticket.')
    }

    // 带ticket的话，校验ticket
    // Have I already validated this ticket?
    req.sessionStore.get(req.session.id, function(err, storedSession) {
      if (err) {
        console.log('Error happened when trying to get session from sessionStore. SessionId: ' + req.session.id);
        console.error(err);

        return res.status(500).send({
          message: 'Error happened when trying to get session from sessionStore. SessionId: ' + req.session.id,
          error: err
        });
      }

      if (storedSession && storedSession.st && (storedSession.st === ticket)) {
        if (debug) {
          console.log('Find st in sessionStore and it\'s the same with the ticket trying to validate. Go throgh it.');
        }

        return next();
      }
      else {
        validateService(res, options.path + options.paths.serviceValidate + '?' + queryString.stringify(params), function(casBody) {
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
  if (debug) {
    console.log('Sending request to: "' + url + '" to validate ticket.');
  }

  fetch(url).then(function(res) {
      if (res.status == 200) {
        return res.text();
      } else {
        console.log('Receive response from cas when validating ticket, but request failed with status code: ' + casRes.statusCode + '!');
        res.status(401).send({
          message: 'Receive response from cas when validating ticket, but request failed with status code: ' + casRes.statusCode + '.'
        });
      }
    })
    .then(function(casBody) {
      if (casBody) {
        if (debug) {
          console.log('Receive response from CAS when validating ticket with status code 200, casBody: ', casBody);
        }

        callback(casBody);
      }
    })
    .catch(function(err) {
      console.log('Receive response from cas when validating ticket, but request failed!');
      console.error(err);
      return res.status(401).send({
        message: 'Receive response from cas when validating ticket, but request failed!',
        error: err
      });
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
  }, function(err, serviceResponse) {
    if (err) {
      console.error('Failed to parse CAS server response when trying to validate ticket.');
      console.error(err);
      return res.status(500).send({
        message: 'Failed to parse CAS server response when trying to validate ticket.',
        error: err
      });
    }

    var success = serviceResponse && serviceResponse.authenticationSuccess && serviceResponse.authenticationSuccess[0],
      user = success && success.user && success.user[0],
      pgtIou = success && success.proxyGrantingTicket && success.proxyGrantingTicket[0];

    if (!serviceResponse) {
      console.error('Invalid CAS server response.');
      return res.status(500).send({
        message: 'Invalid CAS server response, serviceResponse empty.'
      });
    }

    // TODO: 不成功回首页
    if (!success) {
      console.log('Receive response from CAS when validating ticket, but the validation is failed. Redirect to the last request url: ' + req.session.lastUrl);
      if (typeof options.redirect === 'function' && options.redirect(req, res, next)) {
        return;
      }

      return res.redirect(302, req.session.lastUrl);
    }

    req.session.st = ticket;

    if (req.ssoff) {
      req.sessionStore.set(ticket, { sid: req.session.id }, function(err) {
        if (err) {
          console.log('Trying to store ticket in sessionStore for ssoff failed!');
          console.error(err);
        }
      });
    }

    req.session.cas = {};
    for (var casProperty in success) {
      if (casProperty != 'proxyGrantingTicket') {
        req.session.cas[casProperty] = success[casProperty][0];
      }
    }

    if (!pgtIou) {
      if (options.paths.proxyCallback) {
        console.log('pgtUrl is specific, but havn\'t find pgtIou from CAS validation response!');
        return res.status(401).send({
          message: 'pgtUrl is specific, but havn\'t find pgtIou from CAS validation response!'
        });
      } else {
        if (debug) {
          console.log('None-proxy mode, validate ticket succeed, redirecting to lastUrl: ' + req.session.lastUrl);
        }
        req.session.save(function(err) {
          if (err) {
            console.log('Trying to save session failed!');
            console.error(err);
            return res.status(500).send({
              message: 'Trying to save session failed!',
              error: err
            });
          }
          if (typeof options.redirect === 'function' && options.redirect(req, res)) {
            return;
          }

          return res.redirect(302, req.session.lastUrl);
        });
      }

      return;
    }

    retrievePGTFromPGTIOU(req, res, pgtIou, options);
  });
}

function retrievePGTFromPGTIOU(req, res, pgtIou, options) {
  if (debug) {
    console.log('Trying to retrieve pgtId from pgtIou.');
  }

  req.sessionStore.get(pgtIou, function(err, session) {
    if (err) {
      console.log('Get pgtId from sessionStore failed!');
      console.error(err);
      req.sessionStore.destroy(pgtIou);
      return res.status(500).send({
        message: 'Get pgtId from sessionStore failed!',
        error: err
      });
    }

    if (session && session.pgtId) {
      if (debug) {
        console.log('CAS proxy mode login and validation succeed, pgtId finded. Redirecting to lastUrl: ' + req.session.lastUrl);
      }

      req.session.pgt = session.pgtId;

      req.session.save(function(err) {
        if (err) {
          console.error('Trying to save session failed!');
          console.error(err);
          return res.status(500).send({
            message: 'Trying to save session failed!',
            error: err
          });
        }

        // 释放
        req.sessionStore.destroy(pgtIou);

        if (typeof options.redirect === 'function' && options.redirect(req, res)) {
          return;
        }

        return res.redirect(302, req.session.lastUrl);
      });
    } else {
      console.error('CAS proxy mode login and validation succeed, but can\' find pgtId from pgtIou: `' + pgtIou + '`, maybe something wrong with sessionStroe!');
      res.status(401).send({
        message: 'CAS proxy mode login and validation succeed, but can\' find pgtId from pgtIou: `' + pgtIou + '`, maybe something wrong with sessionStroe!'
      });
    }
  });
}
