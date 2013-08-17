var http = require('http');
var httpProxy = require('http-proxy');
var lastTimestamp = null;

module.exports = function(meteorPort, proxyPort) {
  httpProxy.createServer(proxyLogic).listen(proxyPort);
  console.info('DDP Proxy Started on port: ' + proxyPort + '\n');
  
  function proxyLogic(req, res, proxy) {
    var serverData = "";
    var clientData = "";

    req.on('data', onClientData);
    req.once('end', onClientEnd);

    var write = res.write;
    var end = res.end;

    var ddpUrlMatch = /xhr/;

    res.write = function(data) {
      if(ddpUrlMatch.test(req.url)) {
        data = data.toString();
        if(data && data.length > 1) {
          var ddpString = data.substr(1);
          if(ddpString.trim().length > 0) {
            printDdp('server', ddpString);  
          }
        }
      }
      write.call(res, data);
    };

    proxy.proxyRequest(req, res, {
      host: 'localhost',
      port: meteorPort
    });

    function onClientData(data) {
      if(ddpUrlMatch.test(req.url)) {
        data = data.toString();
        if(data && data.length > 0) {
          printDdp('client', data);
        }
      }
    }

    function onClientEnd() {
      req.removeListener('data', onClientData);
    }
  }
};

function printDdp(where, ddpString) {
  try {
    if(!lastTimestamp) {
      lastTimestamp = Date.now();
    }
    var now = Date.now();
    var timeDiff = now - lastTimestamp;
    lastTimestamp = now;

    var ddp = JSON.parse(ddpString);
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