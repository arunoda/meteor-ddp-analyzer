# Meteor DDP Analyzer

### Very Simple DDP Proxy which logs DDP messages

#### Read more on: [Discover Meteor DDP in Realtime](http://meteorhacks.com/discover-meteor-ddp-in-realtime.html)

> Only for debugging purpose, useful if only used with a single client

## Installation

    npm install -g ddp-analyzer

## Start DDP Analyzer Proxy
    
    ddp-analyzer-proxy

## Start Meteor App

You need to either start your Meteor App with few configurations

    export DDP_DEFAULT_CONNECTION_URL=http://localhost:3030
    meteor

or just open `http://localhost:3030` from browser. If neither works, try disabling
WebSockets by adding the following configuration:

    export DISABLE_WEBSOCKETS=true

Now, open your app in the browser and you'll see DDP logs dumped by `ddp-analyzer-proxy`
