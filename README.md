# Meteor DDP Analyzer

### Very Simple DDP Proxy which logs DDP messages

> Only for debugging purpose, useful if only used with single client

## Installation

    npm install -g ddp-analyzer

## Start DDP Analyzer Proxy
    
    ddp-analyzer-proxy

## Start Meteor App

Yo need to start your Meteor App with few configurations

    export DISABLE_WEBSOCKETS=true
    export DDP_DEFAULT_CONNECTION_URL=http://localhost:3030
    meteor

Now, open your app in the browser and you'll see DDP logs dumped by `ddp-analyzer-proxy`
