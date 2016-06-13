var _ = require('lodash');
var url = require('url');
var defaults = {
  debug: false,
  path: '',  // like: https://xx.com/cas
  servicePrefix: '',
  ignore: [],
  ajaxHeader: '',
  redirect: null,
  paths: {
    validate: '/cas/validate',
    serviceValidate: '/cas/serviceValidate',
    proxy: '/cas/proxy',
    login: '/cas/login',
    logout: '/cas/logout',
    proxyCallback: ''
  }
};

module.exports = function(options) {
  if (!options) return _.cloneDeep(defaults);

  if (options.host && options.protocol) {
    console.warn('Setting CAS server path by host/protocal etc. is deprecated, use options.path instead!');
    options.path = url.format(options);
  }

  if (options.service) {
    console.warn('options.service is deprecated, use options.servicePrefix instead!');
    options.servicePrefix = options.service;
  }

  if (options.proxyCallback) {
    console.warn('options.proxyCallback is deprecated, use options.paths.proxyCallback instead!');
    options.paths.proxyCallback = options.proxyCallback;
  }

  if (options.pgtUrl) {
    console.warn('options.pgtUrl is deprecated, use options.paths.proxyCallback instead!');
    options.paths.proxyCallback = options.pgtUrl;
  }

  return _.extend(defaults, options);
};
