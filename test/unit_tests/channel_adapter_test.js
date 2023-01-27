'use strict';
require('./bootstrap_init.js');

const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const ChannelAdapter = require('../../lib/channel_adapter.js');

describe('Channel Adapter tests ->', function() {
    let channelAdapter;
    const mockRegion = 'us-east-1';
    const mockAccountId = 123456789;
    const environment = 'test';

    beforeEach(() => {
        channelAdapter = new ChannelAdapter(mockAccountId, mockRegion, environment);
    });

    it('_publishToSns expects to call publish to SNS function with an SNS message', async () => {
        channelAdapter._SNS.publish = sinon.stub().returns({ promise: sinon.stub().resolves()});
        let mockTopicArn = 'mockTopicArn';
        let mockMessage = { hello: "world" };
        await channelAdapter._publishToSns(mockMessage, mockTopicArn);
        expect(channelAdapter._SNS.publish.calledOnce).to.be.true;
        expect(channelAdapter._SNS.publish.calledWith( {
            Message: JSON.stringify(mockMessage),
            TopicArn: mockTopicArn
        })).to.be.true;
    });

    it('_confirmSnsSubscription expects to call SNS.confirmSubscription with Token and TopicArn', async () => {
        let snsSubscriptionNotificationRequest = require('./sns_subscribe_notification_request_body');
        channelAdapter._SNS.confirmSubscription = sinon.stub().returns({ promise: sinon.stub().resolves()});
        await channelAdapter._confirmSnsSubscription(snsSubscriptionNotificationRequest);
        expect(channelAdapter._SNS.confirmSubscription.calledOnce).to.be.true;
        expect(channelAdapter._SNS.confirmSubscription.calledWith({
            Token: snsSubscriptionNotificationRequest.Token,
            TopicArn: snsSubscriptionNotificationRequest.TopicArn,
            AuthenticateOnUnsubscribe: 'true'
        })).to.be.true;
    });

    it('_confirmSnsSubscription expects error about Subscription already confirmed to be ignored', async () => {
        let snsSubscriptionNotificationRequest = require('./sns_subscribe_notification_request_body');
        sinon.spy(channelAdapter, '_confirmSnsSubscription');
        channelAdapter._SNS.confirmSubscription = sinon.stub().returns({ promise: sinon.stub().throws('AuthorizationError', 'Subscription already confirmed')});
        await channelAdapter._confirmSnsSubscription(snsSubscriptionNotificationRequest);
        expect(channelAdapter._confirmSnsSubscription.threw()).to.be.false;
    });

    it('Expect _getTopicArn to return a correctly formatted ARN topic', () => {
        let expectedTopicArn = `arn:aws:sns:${mockRegion}:${mockAccountId}:E_MOCK_EVENT_${environment.toLocaleUpperCase()}`;
        let actualTopicArn = channelAdapter._getTopicArn('MOCK_EVENT');
        expect(expectedTopicArn).to.be.eq(actualTopicArn);
    });

    it('Expect publishEventToSns to call _publishToSns with Event and topicArn', () => {
        let expectedTopicArn = `arn:aws:sns:${mockRegion}:${mockAccountId}:E_MOCK_EVENT_${environment.toLocaleUpperCase()}`;
        let mockEvent = {
            NAME: 'MOCK_EVENT'
        }
        channelAdapter._publishToSns = sinon.stub().resolves();
        channelAdapter.publishEventToSns(mockEvent);
        expect(channelAdapter._publishToSns.calledOnce).to.be.true;
        expect(channelAdapter._publishToSns.calledWith(
            mockEvent,
            expectedTopicArn
        )).to.be.true;
    });
});