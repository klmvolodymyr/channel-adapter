require('../../config.js');
var chai = require('chai');
global.expect = chai.expect;
global.assert = chai.assert;
global.sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const Bluebird = require('bluebird');
const ChannelAdapterRunner = require('../../lib/channel_adapter_runner.js');

before(async () => {
    global.channelAdapterRunner = new ChannelAdapterRunner();
    await global.channelAdapterRunner.start();
});

after(async () => {
    if (global.channelAdapterRunner) {
        await global.channelAdapterRunner.stop();
    }
}
);