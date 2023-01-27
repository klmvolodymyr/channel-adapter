'use strict';

const log = global.appLogger;
const router = require('koa-router')({ prefix: '/v1/event' });

class SdkRouter {

    constructor(sdkService) {
        this._sdkService = sdkService;
    }

    routers() {
        router.post('/', this._sdkService.onPost.bind(this._sdkService));

        return router.routes();
    }
}

module.exports = SdkRouter;