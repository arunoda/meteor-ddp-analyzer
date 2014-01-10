var http = require('http');
var httpProxy = require('http-proxy');
var sockjs = require('sockjs');
var sjsc = require('sockjs-client');
var lastTimestamp = null;

module.exports = function(meteorPort, proxyPort) {
  var proxy = httpProxy.createProxyServer({
    target: {
      host: 'localhost',
      port: meteorPort
    }
  });

  var server = http.createServer(function (req, res) {
    proxy.web(req, res);
  });

  var sockjsServer = sockjs.createServer({
    prefix: '/sockjs',
    log: function() {},
  });
  sockjsServer.installHandlers(server);

  sockjsServer.on('connection', function(conn) {
    console.log('http://localhost:' + meteorPort + '/sockjs');
    var meteor = sjsc.create('http://localhost:' + meteorPort + '/sockjs');

    conn.on('data', function(message) {
      meteor.write(message);
      printDdp('client', message);
    });
    conn.on('close', meteor.close);

    meteor.on('data', function(message) {
      conn.write(message);
      printDdp('server', message);
    });
    meteor.on('error', meteor.close);
    meteor.on('close', conn.close);
  });

  server.listen(proxyPort);
  console.info('');
  console.info('DDP Proxy Started on port: ' + proxyPort);
  console.info('===============================');
  console.info('Export following env. variables and start your meteor app');
  console.info('  export DDP_DEFAULT_CONNECTION_URL=http://localhost:3030');
  console.info('  meteor');
  console.info('');
};

function printDdp(where, ddp) {
  try {
    if(!lastTimestamp) {
      lastTimestamp = Date.now();
    }
    var now = Date.now();
    var timeDiff = now - lastTimestamp;
    lastTimestamp = now;

    var arrow = (where == 'client')? '-->': '<--';
    if(ddp.forEach) {
      ddp.forEach(function(message) {
        console.log(arrow, timeDiff, message);
      });
    } else {
      console.log(arrow, timeDiff, ddp);
    }
  } catch(ex) {
    console.log('DDP_PARSE_ERROR: ', ex.message, ' || DDP_STRING: ', ddpString);
  }
}