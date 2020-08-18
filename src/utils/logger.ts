import * as winston from "winston";
const DailyRotateFile = require("winston-daily-rotate-file");

const dirname = "./logs";

const logger = winston.createLogger({
  level: "verbose",
  format: winston.format.combine(
    /*
     interpolation support
     logger.info('Found %s at %s', 'error', new Date());
    */
    winston.format.splat(),
   /*
     The simple format outputs
     `${level}: ${message} ${[Object with everything else]}`
    */
    winston.format.simple(),
   /*
      Custom timestamp
    */
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
      new winston.transports.Console({
          level: 'verbose'
      }),
      new DailyRotateFile({
          dirname: dirname,
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d'
      }),
      
  ],
  exitOnError: false,
  exceptionHandlers: [
      new winston.transports.Console({
          level: 'verbose'
      }),
      new DailyRotateFile({
          dirname: dirname,
          filename: 'exceptions-%DATE%.log'
      })
  ]
});

export default logger;
