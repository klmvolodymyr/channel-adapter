'use strict';
// Unfortunately, integration tests with SNS are only applicable with an exposed HTTP endpoint
// Which can not be exposed via CodeFresh
// The only way to use these test are with Port Forwarding port 56432 in the Office's router to your local host
const OFFICE_IP = '66.222.44.99';
const OFFICE_PORT = '56432'
const koa = require('koa');
const bodyParser = require('koa-bodyparser');
const WEB_SERVER_PORT = 56432;
var router = require('koa-router')({ prefix: '/v1/' });
const AWS = require('aws-sdk');
const SNS = new AWS.SNS({ region: 'us-east-1' });
const Bluebird = require('bluebird');
const log = global.appLogger;

class SnsMockSubscriber {

    async start() {
        this.startWebApp();
    }

    async stop() {
        if (!this._app) {
            return;
        }
        this._server.close();
    }

    startWebApp() {
        this._app = new koa();
        this._app.use(bodyParser({
            enableTypes: ['text', 'json']
        }));
        this._app.use(this.routes());
        this._server = this._app.listen(WEB_SERVER_PORT);
    }

    async subscribe(topicArn) {
        return SNS.subscribe({
            Protocol: 'http',
            Endpoint: `http://${OFFICE_IP}:${OFFICE_PORT}/v1/`,
            TopicArn: topicArn
        }).promise();
    }

    routes() {
        router.post('/', async function(ctx) {
            try {
                let requestBody = ctx.request.rawBody;
                requestBody = JSON.parse(requestBody);

                switch (requestBody.Type) {
                    case ('SubscriptionConfirmation'):
                        await this._confirmSubscription(requestBody);
                        break;
                    case ('Notification'):
                        await this._handleNotification(requestBody);
                        break;
                    default:
                        log.warn(`Unsupported SNS message type: ${requestBody.Type}`)
                }

                ctx.status = 200;
            } catch (e) {
                log.error(e);
                ctx.status = 500;
            }
        }.bind(this));

        return router.routes();
    }

    async _handleNotification(notification) {
        log.info(`MesssageId ${notification.MessageId} process start`);
        await Bluebird.delay(1);
        log.info(`MesssageId ${notification.MessageId} process ended`);
    }

    async _confirmSubscription(request) {
        try {
            log.info('confirming subscription')
            await SNS.confirmSubscription({
                Token: request.Token,
                TopicArn: request.TopicArn,
                AuthenticateOnUnsubscribe: 'true'
            }).promise();
            log.info('subscription confirmed');
        } catch (e) {
            if (e.message == 'Subscription already confirmed') {
                return;
            }
            throw e;
        }
    }
}

module.exports = SnsMockSubscriber;