var http = require('http');

/**
 * Start Server
 */
var app = require('./server/app.js');

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

//if(process.argv)
//
var args = process.argv.slice(2);

if (args.some(function (row) {
    return row == '-dev';
  })) {
  var proxyServer = require('./proxyServer');
  proxyServer.run();
}