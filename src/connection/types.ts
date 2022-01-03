import { BufferOptions } from './buffer';

/**
 * Helper types
 */
export type Beautify<T> = { [K in keyof T]: T[K] };
type FilterKeys<T> = { [K in keyof T]: T[K][] };
export type FilterType<T, P extends keyof T, AditonalFields extends { [k: string]: any } = {}> = Partial<
  FilterKeys<Pick<NonNullable<T>, P> & AditonalFields> & { limit?: number }
>;
export type UpdateType<T, AditonalFields extends { [k: string]: any } = {}> = Beautify<
  { id: number } & Partial<Omit<T, 'created_at' | 'id'> & AditonalFields>
>;
export type InsertType<T> = Omit<T, 'id'>;
export type SumFieldType<T, K extends keyof T> = K;

export type SSHConfig = { host: string; port: number; username: string; password: string };

type LogLevel = 'DEBUG' | 'INFO' | 'ERROR';

type LogFunction = (...s: any[]) => void;
export type Logger = (level?: LogLevel) => { debug: LogFunction; info: LogFunction; error: LogFunction };

export type GenericOptions = {
  nullToUndefined?: boolean;
  logLevel?: LogLevel;
  buffer?: BufferOptions;
  logger?: Logger;
};
