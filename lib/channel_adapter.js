'use strict';
const DEFAULTS = global.DEFAULTS;
const AWS = require('aws-sdk');
const log = global.appLogger;
const request = require('request-promise');
const _ = require('lodash');

class ChannelAdapter {

    constructor(awsAccountId, awsRegion, environment) {
        this._SNS = new AWS.SNS({ region: awsRegion });
        this._region = awsRegion;
        this._accountId = awsAccountId;
        this._environment = environment;
        let channelAdapterSdkHost = DEFAULTS.channelAdapterSDK.host;
        let channelAdapterSdkPort = DEFAULTS.channelAdapterSDK.port;
        let channelAdapterSdkPath = DEFAULTS.channelAdapterSDK.pathToPostEvents;
        let channelAdapterSdkHealthPath = DEFAULTS.channelAdapterSDK.pathToHealthCheck;
        this._channelAdapterSdkUri = `http://${channelAdapterSdkHost}:${channelAdapterSdkPort}${channelAdapterSdkPath}`;
        this._channelAdapterHelathUri = `http://${channelAdapterSdkHost}:${channelAdapterSdkPort}${channelAdapterSdkHealthPath}`;
    }

    publishEventToSns(event) {
        let topicArn = this._getTopicArn(`${event.NAME}`);

        return this._publishToSns(event, topicArn);
    }

    _publishToSns(object, topicArn) {
        return this._SNS.publish({ Message: JSON.stringify(object), TopicArn: topicArn }).promise();
    }

    _getTopicArn(eventName) {
        return `arn:aws:sns:${this._region}:${this._accountId}:E_${eventName}_${_.toUpper(this._environment)}`;
    }

    async _confirmSnsSubscription(snsRequest) {
        try {
            log.info(`Confirming subscription for ${snsRequest.TopicArn}`);

            await this._SNS.confirmSubscription({
                Token: snsRequest.Token,
                TopicArn: snsRequest.TopicArn,
                AuthenticateOnUnsubscribe: 'true'
            }).promise();
        } catch (e) {

            if (e.message.includes('Subscription already confirmed')) {
                return;
            }

            log.error('Failed to confirm subscription', e);
            throw e;
        }
        log.info(`Subscription confirmed for ${snsRequest.TopicArn}`);
    }

    _handleSnsNotification(snsNotification) {
        return this._postEventToSdk(snsNotification);
    }

    _postEventToSdk(snsNotification) {
        let event = snsNotification.Message;
        event = JSON.parse(event);

        let options = {
            method: 'POST',
            uri: this._channelAdapterSdkUri,
            body: event,
            simple: true,
            resolveWithFullResponse: true,
            json: true,
        };

        return request(options);
    }

    healthCheck() {
        return this._checkEventHandlerHealth();
    }

    async _checkEventHandlerHealth() {
        let options = {
            method: 'GET',
            uri: this._channelAdapterHelathUri,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        let response = await request(options);

        if (response.statusCode === 200) {
            return true;
        }

        return false;
    }
}

module.exports = ChannelAdapter;