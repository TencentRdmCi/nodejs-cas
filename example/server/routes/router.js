/**
 * @file api接口定义入口文件
 * @path /api
 */
var Jobs = require('./api/jobs.js');

module.exports = function (app) {

  // 建立一个router实例
  var router = require('express').Router();

  // DO LOGGING or something else
  // =============================================================================

  // middleware to use for all requests
  router.use(function (req, res, next) {

    // 给所有api接口设置content-type
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
  });

  // 注册路由
  // =============================================================================
  router.get('/', function (req, res) {
    res.json({
      message: 'welcome to the brand new ci4.0 api!'
    })
  });

  // 实例化jobs的路由
  Jobs(router);

  // 注册api路由
  // =============================================================================
  app.use('/api', router);

  app.use('/', function (req, res, next) {
    res.render('index', {session: JSON.stringify(req.session, undefined, 4)});
  });
};