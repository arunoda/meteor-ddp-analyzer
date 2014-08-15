# Meteor DDP Analyzer

### Very Simple DDP Proxy which logs DDP messages

#### Read more on: [Discover Meteor DDP in Realtime](http://meteorhacks.com/discover-meteor-ddp-in-realtime.html)
[![Discover Meteor DDP in Realtime](https://i.cloudup.com/IsUVXUOspa.png)](http://meteorhacks.com/discover-meteor-ddp-in-realtime.html)


## Installation

    npm install -g ddp-analyzer

## Start DDP Analyzer Proxy
    
    ddp-analyzer-proxy

## Start Meteor App

You need to either start your Meteor App with few configurations

    export DDP_DEFAULT_CONNECTION_URL=http://localhost:3030
    meteor

or just open `http://localhost:3030` from browser.

Now, open your app in the browser and you'll see DDP logs dumped by `ddp-analyzer-proxy`

## Known Issues

DDP Analyzer currently does not work with WebSockets but instead uses Meteors HTTP based fallback while active. Pull requests adding proper WebSocket support are welcome!
