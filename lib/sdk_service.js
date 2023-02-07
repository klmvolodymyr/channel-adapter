'use strict';

const log = global.appLogger;
const HttpStatus = require('http-status-codes');

class SdkService {
    constructor(channelAdapter) {
        this._channelAdapter = channelAdapter;
    }

    async onPost(ctx) {
        let requestBody = ctx.request.body;

        try {
            await this._channelAdapter.publishEventToSns(requestBody);
            ctx.status = HttpStatus.OK;
        } catch (e) {
            log.error(e);
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
            ctx.body = { name: e.name, stack: e.stack };
        }
    }
}

module.exports = SdkService;