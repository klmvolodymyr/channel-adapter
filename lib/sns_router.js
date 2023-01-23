'use strict';
const log = global.appLogger;
const router = require('koa-router')({ prefix: '/v1/sns/' });
const MessageValidator = require('sns-validator');
const validator = new MessageValidator();
const HttpStatus = require('http-status-codes');

class SnsRoute {
    constructor(snsService) {
        this._snsService = snsService;
    }

    routers() {
        router.use('/', this._validateSnsMessage.bind(this));
        router.post('/', this._snsService.onPost.bind(this._snsService));

        return router.routes();
    }

    async _validateSnsMessage(ctx, next) {
        let requestBody = ctx.request.rawBody;
        requestBody = JSON.parse(requestBody);
        let isValid = await this._isValidSNSMessage(requestBody);

        if (!isValid) {
            ctx.throw(401);
            return;
        }

        await next();
    }

    _isValidSNSMessage(message) {
        return new Promise((resolve, reject) => {
            validator.validate(message, function (err, message) {

                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
}

module.exports = SnsRoute;