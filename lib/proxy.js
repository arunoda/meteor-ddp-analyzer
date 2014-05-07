var http = require('http');
var sockjs = require('sockjs');
var sjsc = require('sockjs-client');
var tty = require('tty');
var util = require('util');
var _ = require('underscore');
var request = require('request');
var url = require('url');
require('colors');

var lastTimestamp = {};
var clientIds = 0;

module.exports = function(meteorPort, proxyPort) {
  var sockjsServer = sockjs.createServer({
    prefix: '/sockjs',
    log: function() {},
    // we are proxying /sockjs/info to the actual app
    // hence we are using the middleware() of sockjs 
    // then it can't work with WebSockets
    websocket: false
  });

  var middleware = sockjsServer.middleware();
  var server = http.createServer(handleBrowserRequests(middleware, meteorPort));
  sockjsServer.on('connection', onBrowserConnection(meteorPort));

  server.listen(proxyPort);
  printWelcomeMessage(proxyPort);
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

function printWelcomeMessage(proxyPort) {
  console.info('');
  console.info('DDP Proxy Started on port: ' + proxyPort);
  console.info('===============================');
  console.info('Export following env. variables and start your meteor app');
  console.info('  export DDP_DEFAULT_CONNECTION_URL=http://localhost:3030');
  console.info('  meteor');
  console.info('');
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

function onBrowserConnection(meteorPort) {
  return function(conn) {
    var clientId = ++clientIds;
    console.log(util.format('New Client: [%d]', clientId) + '\n');

    var meteor = sjsc.create('http://localhost:' + meteorPort + '/sockjs');
    closeBrowserConnection = _.once(conn.close.bind(conn));

    conn.on('data', function(message) {
      meteor.write(message);
      printDdp('client', message, clientId);
    });
    conn.on('close', meteor.close);

    meteor.on('data', function(message) {
      conn.write(message);
      printDdp('server', message, clientId);
    });

    meteor.on('error', function() {
      closeBrowserConnection();
      meteor.close();
    });

    meteor.on('close', closeBrowserConnection);
  }
}

function handleBrowserRequests(sockjsMiddleware, meteorPort) {
  return function(req, res) {
    var parsedUrl = url.parse(req.url);
    if(parsedUrl.pathname == "/sockjs/info") {
      // we need to forward info request to the actual app
      // otherwise Meteor reconnect logic goes crazy
      var meteorAppInfoUrl = "http://localhost:" + meteorPort + req.url;
      request.get("http://localhost:" + meteorPort + req.url, function(err, r, body) {
        if(err) {
          res.end();
        } else {
          res.writeHead(r.statusCode, r.headers);
          res.end(body);
        }
      });
    } else {
      sockjsMiddleware(req, res);
    }
  }
}