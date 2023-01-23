'use strict';

require('./bootstrap_init.js');
const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const request = require('request-promise');
const SnsRouter = require('../../lib/sns_router');

describe('SNS Router tests', function() {
    let snsRouter;

    beforeEach(() => {
        snsRouter = new SnsRouter();
    });

    it('SnsRouter expects to call Channel Adapter\'s _confirmSnsSubscription upon receiving a SubscriptionConfirmation SNS message through POST', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._confirmSnsSubscription = sinon.stub();
        let snsSubscriptionNotificationRequest = require('../unit_tests/sns_subscribe_notification_request_body');
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsSubscriptionNotificationRequest),
            simple: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        await request(options);
        expect(channelAdapterRunner._channelAdapter._confirmSnsSubscription.called).to.be.true;
        expect(channelAdapterRunner._channelAdapter._confirmSnsSubscription.calledWith(snsSubscriptionNotificationRequest)).to.be.true;
    });

    it('SnsRouter expects to call Channel Adapter\'s  _handleSnsNotification upon receiving Notification SNS message through POST', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._handleSnsNotification = sinon.stub();
        let snsNotification = require('../unit_tests/sns_notification_request_body');
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsNotification),
            simple: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        await request(options);
        expect(channelAdapterRunner._channelAdapter._handleSnsNotification.calledOnce).to.be.true;
        expect(channelAdapterRunner._channelAdapter._handleSnsNotification.calledWith(snsNotification)).to.be.true;
    });

    it('_isValidSNSMessage is expected to return true on a valid SNS message', async () => {
        let snsNotification = require('../unit_tests/sns_notification_request_body');
        let isValid = await snsRouter._isValidSNSMessage(snsNotification);
        expect(isValid).to.be.true;
    });

    it('_isValidSNSMessage is expected to return false on a non-valid SNS message', async () => {
        let snsNotification = require('../unit_tests/sns_notification_request_body');
        snsNotification.Signature = _.replace(snsNotification.Signature,'a','b');
        let isValid = await snsRouter._isValidSNSMessage(snsNotification);
        expect(isValid).to.be.false;
    });

    it('SNS Router is expected to return 401 on non valid SNS notification message', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._handleSnsNotification = sinon.stub();
        let snsNotification = require('../unit_tests/sns_notification_request_body');
        snsNotification.Signature = _.replace(snsNotification.Signature,'a','b');
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsNotification),
            simple: false,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            },
            resolveWithFullResponse: true
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(401);
        expect(channelAdapterRunner._channelAdapter._handleSnsNotification.calledOnce).to.be.false;
    });

    it('SNS Router is expected to return 401 on non valid SNS subscription message', async () => {
        let channelAdapterRunner = global.channelAdapterRunner;
        channelAdapterRunner._channelAdapter._confirmSnsSubscription = sinon.stub();
        let snsSubscriptionNotificationRequest = require('../unit_tests/sns_subscribe_notification_request_body');
        snsSubscriptionNotificationRequest.Signature = _.replace(snsSubscriptionNotificationRequest.Signature,'a','b');
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsSubscriptionNotificationRequest),
            simple: false,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            },
            resolveWithFullResponse: true
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(401);
        expect(channelAdapterRunner._channelAdapter._confirmSnsSubscription.called).to.be.false;
    });
});