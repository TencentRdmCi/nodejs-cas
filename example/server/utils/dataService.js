var request = require('request'),
  url = require('url'),
  _ = require('lodash'),
  errnoConfig = require('./statusCode.js');

module.exports = {
  get: get
};

// 方法定义
// =============================================================================


function get(path, params) {
  //console.log(`path : ${path}`);
  return new Promise(function (resolve, reject) {
    var urlObj = url.parse(path);

    urlObj.query = _.extend({}, urlObj.query, params);

    //console.log('urlObj', urlObj, url.format(urlObj));

    var serverUrl = url.format(urlObj);

    console.log('send request to ' + serverUrl);

    request.get(serverUrl, {
        encoding: 'utf8',
        gzip: true
      }, function (err, res, body) {
        if (err) reject(err);
        resolve(res);
      }
    );
  });
}