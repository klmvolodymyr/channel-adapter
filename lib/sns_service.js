'use strict';
const log = global.appLogger;
const HttpStatus = require('http-status-codes');

class SnsService {
    constructor(channelAdapter) {
        this._channelAdapter = channelAdapter;
    }

    async onPost(ctx) {
        let requestBody = ctx.request.rawBody;
        requestBody = JSON.parse(requestBody);

        try {
            switch (requestBody.Type) {
                case ('SubscriptionConfirmation'):
                    await this._channelAdapter._confirmSnsSubscription(requestBody);
                break;
                case ('Notification'):
                    await this._channelAdapter._handleSnsNotification(requestBody);
                break;
                default:
                    log.warn(`Unsupported SNS message type: ${requestBody.Type}`)
            }
            ctx.status = HttpStatus.OK;
        } catch (e) {
            log.error(e);
            ctx.body = { name: e.name, stack: e.stack };
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
}

module.exports = SnsService;