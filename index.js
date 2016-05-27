var configure = require('./lib/configure'),
  serviceValidate = require('./lib/service-validate'),
  authenticate = require('./lib/authenticate'),
  renew = require('./lib/renew'),
  gateway = require('./lib/gateway'),
  ssoff = require('./lib/ssoff'),
  proxyTicket = require('./lib/proxy-ticket');

function CasClient(options) {
  this.options = configure(options);
}

CasClient.prototype.serviceValidate = function() {
  return serviceValidate(this.options);
};

CasClient.prototype.authenticate = function() {
  return authenticate(this.options);
};

CasClient.prototype.renew = function() {
  return renew(this.options);
};

CasClient.prototype.gateway = function() {
  return gateway(this.options);
};

CasClient.prototype.ssoff = function(serviceUrl) {
  return ssoff(this.options, serviceUrl);
};

CasClient.proxyTicket = function(pgt, targetService, callback) {
  return proxyTicket(pgt, targetService, callback);
};

module.exports = CasClient;