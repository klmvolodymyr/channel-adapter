'use strict';
require('./bootstrap_init.js');

const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const SdkService = require('../../lib/sdk_service');
const ChannelAdapter = require('../../lib/channel_adapter');

describe('SDK service tests -> ', function() {
    let sdkService;
    let channelAdapter;

    beforeEach(() => {
        channelAdapter = new ChannelAdapter();
        sdkService = new SdkService(channelAdapter);
    })

    it('Call onPost expects to call Channel Adapter\'s publishEventToSns function', async () => {
        channelAdapter.publishEventToSns = sinon.stub().resolves();
        let mockBody = { hello: 'world' }
        await sdkService.onPost({
            request: {
                body: mockBody
            }
        });
        expect(channelAdapter.publishEventToSns.calledOnce).to.be.true;
    });
});