module.exports = function (winston, level, destinations, logFilePath) {
    logFilePath = (logFilePath || 'logs/app.log');
    destinations = (destinations || ['file','console']);
    level = (level || 'verbose').toLowerCase();
    console.log(`Setting a winston logger with ${level} log level`);
    console.log(`Setting a winston logger to ${destinations}`);
    let winstonTransports = [];

    if (destinations.indexOf('console') > -1) {
        winstonTransports.push(
                    new winston.transports.Console({
                        format: winston.format.combine(
                            winston.format.colorize(),
                            winston.format.simple()
                        )
                    }));
    }

    if (destinations.indexOf('file') > -1) {
        console.log(`Logs will be stored to ${logFilePath}`);
        winstonTransports.push(
                    new winston.transports.File({
                      "timestamp": true,
                      "json": false,
                      "filename": logFilePath,
                      "maxfiles": 5,
                      "maxsize": 10485760,
                      "level": level,
                      "json": true
                    }));
    }

    let logger = new winston.createLogger({
        transports: winstonTransports
    });

    return logger;
};