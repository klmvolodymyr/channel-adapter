'use strict'

require('./bootstrap_init.js');
const _ = require('lodash');
const expect = global.expect;
const ChannelAdapter = require('../../lib/channel_adapter')
const ChannelAdapterRunner = require('../../lib/channel_adapter_runner');
const AWS = require('aws-sdk');
const SNS = new AWS.SNS({ region: 'us-east-1' });
const Bluebird = require('bluebird');
const SnsMockSubscriber = require('./sns_mock_subscriber');
const TEST_TOPIC_NAME = 'channel-adapter-test-topic';

describe('Channel Adapter Integrations publish tests ->', function() {
    this.timeout(60000);
    let channelAdapter;
    let topicARN;


    before(async () => {
        topicARN = await setUpSns();
    });

    beforeEach(() => {
        channelAdapter = new ChannelAdapter(topicARN);
    });

    after(async () => {
        await tearDownSns(topicARN);
    });

    it('publishToSNS expects to successfully publish a message to SNS', async () => {
        let result = await channelAdapter.publishToSns({
            hello: 'world'
        });
        expect(result.MessageId).to.be.not.undefined;
    });
});

describe('Channel Adapter Integrations subscribe tests with mock subscriber', function() {
    this.timeout(60000);
    let channelAdapter;
    let mockSubscriber;
    let topicARN;

    before(async () => {
        topicARN = await setUpSns();
    });

    beforeEach(async () => {
        channelAdapter = new ChannelAdapter(topicARN);
        mockSubscriber = new SnsMockSubscriber();
        await mockSubscriber.start();
    });

    afterEach(async () => {
        if (mockSubscriber) {
            await mockSubscriber.stop();
        }
    });

    after(async () => {
        await tearDownSns(topicARN);
    });

    it('Expect consumed message to be equal to published one', async () => {
        mockSubscriber._handleNotification = sinon.stub();
        sinon.spy(mockSubscriber, '_confirmSubscription');
        await mockSubscriber.subscribe(topicARN);
        // wait for SNS subscription confirmation messages has arrived
        await Bluebird.delay(5000);
        expect(mockSubscriber._confirmSubscription.called).to.be.true;
        let mockMessageJSON = {
            hello: 'world'
        };
        await channelAdapter.publishToSns(mockMessageJSON);
        await Bluebird.delay(5000);
        expect(mockSubscriber._handleNotification.calledOnce).to.be.true;
        let snsRequestBody = mockSubscriber._handleNotification.args[0][0];
        expect(snsRequestBody.Message).to.be.eq(JSON.stringify(mockMessageJSON));
    });

});

describe('Channel Adapter with runner tests and SNS', function() {

    // Unfortunately, integration tests with SNS are only applicable with an exposed HTTP endpoint
    // Which can not be exposed via CodeFresh
    // The only way to use these test are with Port Forwarding port 56432 in the Office's router to your local host
    const OFFICE_IP = '62.219.214.242';
    const OFFICE_PORT = '56432'

    this.timeout(60000);

    let channelAdapterRunner;
    let topicARN;

    before(async () => {
        topicARN = await setUpSns();
        channelAdapterRunner = new ChannelAdapterRunner();
        await channelAdapterRunner.start();
    });

    after(async () => {
        if (channelAdapterRunner) {
            await channelAdapterRunner.stop();
        }
        await tearDownSns(topicARN);
    });

    it('Channel Adapter expects to confirm subscription upon subscribing to topic', async () => {
        sinon.spy(channelAdapterRunner._channelAdapter, '_confirmSnsSubscription');
        await SNS.subscribe({
            Protocol: 'http',
            Endpoint: `http://${OFFICE_IP}:${OFFICE_PORT}/v1/sns/`,
            TopicArn: topicARN
        }).promise();
        await Bluebird.delay(5000);
        expect(channelAdapterRunner._channelAdapter._confirmSnsSubscription.called).to.be.true;

    });

    it('Channel Adapter expects to be called on _handleSnsNotification upon receiving an SNS Notification', async () => {
        channelAdapterRunner._channelAdapter._handleSnsNotification = sinon.stub();
        let mockMessage = {
            hello: 'world'
        }
        await SNS.subscribe({
            Protocol: 'http',
            Endpoint: `http://${OFFICE_IP}:${OFFICE_PORT}/v1/sns/`,
            TopicArn: topicARN
        }).promise();
        await Bluebird.delay(5000);
        await SNS.publish({
            Message: JSON.stringify(mockMessage),
            TopicArn: topicARN
        }).promise()
        await Bluebird.delay(5000);
        expect(channelAdapterRunner._channelAdapter._handleSnsNotification.called).to.be.true;
    });
});

async function setUpSns() {
    let result = await SNS.createTopic({
        Name: TEST_TOPIC_NAME
    }).promise();
    return result.TopicArn;
}

async function tearDownSns(topicArn) {
    await SNS.deleteTopic({
        TopicArn: topicArn
    }).promise();
}