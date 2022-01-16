import { GenericOptions, Logger } from '@src/model/connection';

export const log = (logger?: Logger | typeof console, logLevel?: GenericOptions['logLevel']) =>
  logger instanceof Function ? logger(logLevel) : logger;
