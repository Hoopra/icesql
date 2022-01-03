import { GenericOptions, Logger } from './types';

export const log = (logger?: Logger | typeof console, logLevel?: GenericOptions['logLevel']) =>
  logger instanceof Function ? logger(logLevel) : logger;
