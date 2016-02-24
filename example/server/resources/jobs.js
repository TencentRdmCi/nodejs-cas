var dataService = require('../utils/dataService.js'),
  config = require('../config.js'),
  statusCode = require('../utils/statusCode.js');

/**
 *
 * @path {server}/job/jobId?target=new
 * @method GET
 * @param jobId
 * @returns {Promise.<T>}
 */
function getJobById(pt, jobId) {
  return dataService.get(config.ciServerPrefix + '/job/' + jobId, {
    target: 'new',
    ticket: pt
  })
    .then(function (response) {

      var result = {};

      if (response.statusCode == 200) {
        try {
          result.data = JSON.parse(response.body);
          result.errno = statusCode.errno.ERRNO_RESPONSE_SUCCESS;
          result.msg = 'success';
        } catch (e) {
          result.errno = statusCode.errno.ERRNO_RESPONSE_DATA_PARSE_ERROR;
        }
      }
      else {
        result.errno = statusCode.normalizeStatusCode(response.statusCode);
      }

      return result;
    }
  );
}

module.exports = {
  getJobById: getJobById
};