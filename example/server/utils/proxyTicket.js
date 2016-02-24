var cas = require('../../../index');
var config = require('../../config.json');

module.exports = function () {
  return cas.proxyTicket({targetService: config.ciServerPrefix + '/shiro-cas'});
};