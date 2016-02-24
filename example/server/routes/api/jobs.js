/**
 * @path /jobs
 * @param router
 */

var Jobs = require('../../resources/jobs.js');
var proxyTicket = require('../../utils/proxyTicket');

module.exports = function (router) {

  router.route('/jobs')
    .all(proxyTicket())
    .get(function (req, res) {
      res.json({
        errno: 0,
        data: '',
        msg: 'hello'
      });
    });

  router.route('/jobs/:jobId')
    .all(proxyTicket())
    .get(function (req, res) {

      var jobId = req.params.jobId;

      Jobs.getJobById(req.pt, jobId)
        .then(function (result) {
          res.send(result);
        });
    })
};