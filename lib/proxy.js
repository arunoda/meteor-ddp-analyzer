var http = require('http');
var httpProxy = require('http-proxy');
var sockjs = require('sockjs');
var sjsc = require('sockjs-client');
var tty = require('tty');
var util = require('util');
require('colors');

var lastTimestamp = {};
var clientIds = 0;

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
    var clientId = ++clientIds;
    console.log(util.format('New Client: [%d]', clientId) + '\n');
    var meteor = sjsc.create('http://localhost:' + meteorPort + '/sockjs');

    conn.on('data', function(message) {
      meteor.write(message);
      printDdp('client', message, clientId);
    });
    conn.on('close', meteor.close);

    meteor.on('data', function(message) {
      conn.write(message);
      printDdp('server', message, clientId);
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

function printDdp(where, ddp, clientId) {
  try {
    if(!lastTimestamp[clientId]) {
      lastTimestamp[clientId] = Date.now();
    }
    var now = Date.now();
    var timeDiff = now - lastTimestamp[clientId];
    lastTimestamp[clientId] = now;

    if(ddp.forEach) {
      ddp.forEach(function(message) {
        printMessage(clientId, timeDiff, message, where);
      });
    } else {
      printMessage(clientId, timeDiff, ddp, where);
    }
  } catch(ex) {
    console.log('DDP_PARSE_ERROR: ', ex.message, ' || DDP_STRING: ');
  }
}


function printMessage(clientId, timeDiff, message, where) {
  var arrow = (where == 'client')? ' OUT ': ' IN  ';
  if(process.stdout.isTTY) {
    var color = (where == 'client')? 'red': 'green';
    arrow = arrow[color].bold.inverse;
    timeDiff = (" " + timeDiff + " ").bold.inverse;
    clientId = (" " + clientId + " ").yellow.bold.inverse;
  }
  
  var finalMessage = util.format('%s%s%s %s', clientId, arrow, timeDiff, message);
  console.log(finalMessage);
}