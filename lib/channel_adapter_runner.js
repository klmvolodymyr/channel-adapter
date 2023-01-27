'use strict';

const DEFAULTS = global.DEFAULTS;
const log = global.appLogger;
const ChannelAdapter = require('./channel_adapter.js');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const SdkRouter = require('./sdk_router.js');
const SdkService = require('./sdk_service');
const SnsRouter = require('./sns_router.js');
const SnsService = require('./sns_service');
const HealthRouter = require('./health_router');

class ChannelAdapterRunner {

    constructor(injectedSnsRouter = null) {
        this._channelAdapter = new ChannelAdapter(
            DEFAULTS.aws.accountId,
            DEFAULTS.aws.region,
            DEFAULTS.ENV
        );
        this._options = DEFAULTS.channelAdapterRunner;
        this._sdkServer = {};
        this._snsServer = {};

        if (injectedSnsRouter) {
            this.SnsRouter = injectedSnsRouter;
        } else {
            this.SnsRouter = SnsRouter;
        }
    }

    async start() {
        await this._startSDKWebServer();

        return this._startSNSWebServer();
    }

    stop() {
        this._sdkServer.server.close();
        this._snsServer.server.close();
    }

    async _startSDKWebServer() {
        await this._runWebServer(this._sdkServer, this._options.sdkIncomingPort, SdkService, SdkRouter);
        log.info(`Channel Adapter: Web Server for incoming EVENTs from SDK has Started at port ${this._options.sdkIncomingPort}`);
    }

    async _startSNSWebServer() {
        await this._runWebServer(this._snsServer, this._options.snsIncomingPort, SnsService, this.SnsRouter, true);
        log.info(`Channel Adapter: Web Server for incoming EVENTs from SNS has Started at port ${this._options.snsIncomingPort}`);
    }

    async _runWebServer(server, port, concereteService, concreteRouter, addHealthCheck) {
        server.app = new Koa();
        this._addRequiredMiddlewares(server.app);
        server.service = new concereteService(this._channelAdapter);
        let sdkRouter = new concreteRouter(server.service);
        server.app.use(sdkRouter.routers());

        if (addHealthCheck) {
            let healthRouter = new HealthRouter(this._channelAdapter);
            server.healthRouter = healthRouter;
            server.app.use(healthRouter.routers());
        }

        server.server = await this._startWebServerAsync(server.app, port);
    }

    _addRequiredMiddlewares(app) {
        app.use(BodyParser({
            enableTypes: ['text', 'json']
        }));
    }

    _startWebServerAsync(app, port) {
        return new Promise((resolve, reject) => {
            let server = app.listen(port, (err) => {

                if (err) {
                    reject(err);
                }
                resolve(server);
            });
        });
    }
}

module.exports = ChannelAdapterRunner;