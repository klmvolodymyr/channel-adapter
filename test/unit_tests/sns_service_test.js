'use strict';
require('./bootstrap_init.js');
const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const SnsService = require('../../lib/sns_service');
const ChannelAdapter = require('../../lib/channel_adapter');

describe('SNS Services tests ->', function() {

    let snsService;
    let channelAdapter;
    beforeEach(() => {
        channelAdapter = new ChannelAdapter();
        snsService = new SnsService(channelAdapter);
    });

    it('SnsService expects to call Channel Adapter\'s _confirmSnsSubscription upon receiving a SubscriptionConfirmation SNS message through POST', async () => {
        let snsSubscriptionNotificationRequest = require('./sns_subscribe_notification_request_body');
        channelAdapter._confirmSnsSubscription = sinon.stub();
        await snsService.onPost({
            request: {
                rawBody: JSON.stringify(snsSubscriptionNotificationRequest)
            }
        })
        expect(channelAdapter._confirmSnsSubscription.calledOnce).to.be.true;
        expect(channelAdapter._confirmSnsSubscription.calledWith(snsSubscriptionNotificationRequest)).to.be.true;
    });

    it('SnsService expects to call Channel Adapter\'s  _handleSnsNotification upon receiving Notification SNS message through POST', async () => {
        channelAdapter._handleSnsNotification = sinon.stub();
        let snsNotification = require('./sns_notification_request_body');
        await snsService.onPost({
            request: {
                rawBody: JSON.stringify(snsNotification)
            }
        });
        expect(channelAdapter._handleSnsNotification.calledOnce).to.be.true;
        expect(channelAdapter._handleSnsNotification.calledWith(snsNotification)).to.be.true;
    });
});