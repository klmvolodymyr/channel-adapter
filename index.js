'use strict'
require('./config.js');
const co = require('co');
const ChannelAdapterRunner = require('./lib/channel_adapter_runner.js');
const log = global.appLogger;

co(async () =>  {
    let channelAdapter = new ChannelAdapterRunner();
    await channelAdapter.start();
})
.catch(function(err) {
    console.log(err);
    log.error(err);
});