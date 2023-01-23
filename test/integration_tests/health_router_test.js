'use strict';
require('./bootstrap_init');
const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const request = require('request-promise');

describe('Health Router tests -> ', function() {

    it('Health check expects to return 200 when SDK replies with 200', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._checkEventHandlerHealth = sinon.stub().resolves(true);
        let options = {
            method: 'GET',
            uri: `http://localhost:56432/health/`,
            json: true,
            resolveWithFullResponse: true,
            simple: false
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(200);
    });

    it('Health check expects to return 500 when SDK replies with 500', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._checkEventHandlerHealth = sinon.stub().resolves(false);        let options = {
            method: 'GET',
            uri: `http://localhost:56432/health/`,
            json: true,
            resolveWithFullResponse: true,
            simple: false
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(500);
    });

});