'use strict';
require('./bootstrap_init.js');

const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const request = require('request-promise');

describe('SDK Router tests', () => {

    it('SdkRouter expects to call Channel Adapter\'s _publishToSns upon receiving an EVENT through POST', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._publishToSns = sinon.stub();
        let mockBody = {
            hello: 'world'
        }
        let options = {
            method: 'POST',
            uri: `http://localhost:32000/v1/event/`,
            body: mockBody,
            json: true,
            simple: true
        };

        await request(options);
        expect(channelAdapterRunner._channelAdapter._publishToSns.calledOnce).to.be.true;
        expect(channelAdapterRunner._channelAdapter._publishToSns.calledWith(mockBody)).to.be.true;
    });

});