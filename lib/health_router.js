'use strict';
const router = require('koa-router')({ prefix: '/health/' });
const HttpStatus = require('http-status-codes');

class HealthRouter {

    constructor(channelAdapter) {
        this._channelAdapter = channelAdapter;

    }

    routers() {
        router.get('/', this._healthCheck.bind(this));

        return router.routes();
    }

    async _healthCheck(ctx) {
        try {
            let isChannelAdapterHealth = await this._channelAdapter.healthCheck();

            if (isChannelAdapterHealth) {
                ctx.status = HttpStatus.OK;
                return;
            }
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
        } catch (e) {
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
            ctx.body = JSON.stringify(e);
        }
    }
}

module.exports = HealthRouter;