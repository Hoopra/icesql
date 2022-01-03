import { GenericOptions, Logger } from '@src/connection/types';
import { Pool, PoolConnection, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import { asQuery, deepConvertNullToUndefined } from './util';
import { BufferOptions, stringifyBufferValues } from './buffer';
import { log } from './logger';
import { formatSQL } from '@src/util/format';
import { Query, QueryObject, QueryArg } from '@src/model/template';

const convertNullValuesToUndefined = <T extends Object | Object[]>(entity: T, enabled = false): T => {
  return enabled ? (deepConvertNullToUndefined(entity) as T) : entity;
};

export class Connection {
  conn: Pool | PoolConnection;
  logger?: Logger | typeof console | undefined;

  public options: GenericOptions;

  constructor(conn: Pool | PoolConnection, options: GenericOptions = {}) {
    this.conn = conn;
    this.options = {
      ...options,
      nullToUndefined: options.nullToUndefined ?? false,
    };
    this.logger = options.logger;
  }

  /**
   * Use query when doing SELECT. The expected result will be an array of RowDataPacket
   * @param query
   */
  public async query<T = RowDataPacket>(
    query: Query | QueryObject | string,
    bufferOptions: BufferOptions = {}
  ): Promise<T[]> {
    const [statement, args = []] = asQuery(query);
    this.logSQL(statement, args);
    const response = await this.exec(statement, args);
    if (!Array.isArray(response)) {
      throw Error(
        'Return type error. query() should only be used for SELECT. For INSERT, UPDATE, DELETE and SET use execute()'
      );
    }

    const unbuffered = stringifyBufferValues(response as T[], bufferOptions ?? this.options.buffer);
    return convertNullValuesToUndefined<T[]>(unbuffered, Boolean(this.options.nullToUndefined));
  }

  public async queryRequired<T = RowDataPacket>(
    query: Query | QueryObject | string,
    errorMessage?: string,
    bufferOptions: BufferOptions = {}
  ): Promise<[T] & T[]> {
    const result = await this.query(query, bufferOptions ?? this.options.buffer);
    if (!result?.length) {
      throw Error(errorMessage ?? `no results found for query ${JSON.stringify(asQuery(query))}`);
    }
    return result as [T] & T[];
  }

  public async queryOne<T = RowDataPacket>(
    query: Query | QueryObject | string,
    bufferOptions: BufferOptions = {}
  ): Promise<T | null> {
    const [result] = await this.query(query, bufferOptions ?? this.options.buffer);
    return result as T;
  }

  public async queryOneRequired<T = RowDataPacket>(
    query: Query | QueryObject | string,
    errorMessage?: string,
    bufferOptions: BufferOptions = {}
  ): Promise<T> {
    const result = await this.queryOne(query, bufferOptions ?? this.options.buffer);
    if (!result) {
      throw Error(errorMessage ?? `no results found for query ${JSON.stringify(asQuery(query))}`);
    }
    return result as T;
  }

  /**
   * Use execute when doing INSERT, UPDATE or DELETE. The expected result will be a ResultSetHeader
   * @param query
   */
  public async execute(query: Query | QueryObject | string): Promise<ResultSetHeader> {
    const [statement, args = []] = asQuery(query);
    this.logSQL(statement, args);
    const response = await this.exec(statement, args);
    if (Array.isArray(response)) {
      throw Error(
        'Return type error. execute() should only be used for INSERT, UPDATE, DELETE and SET. For SELECT use query()'
      );
    }
    return response as ResultSetHeader;
  }

  /**
   *  Implementation of the mysql2 execute function conserving the return types.
   *
   *  Return definition
   *
   *  SELECT -> [result, columnDefinitions] result = Array
   *
   *  INSERT / UPDATE / DELETE -> [result] result = ResultSetHeader
   *
   * @param sql
   * @param args
   */
  public async exec(
    sql: string,
    args: QueryArg[]
  ): Promise<RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader> {
    try {
      const [response] = await this.conn.execute(sql, args);
      return response;
    } catch (err) {
      log(this.logger, this.options.logLevel)?.error?.(`${err} - failing SQL: ${formatSQL(sql, args)}`);
      throw typeof err === 'string' ? Error(err) : (err as Error);
    }
  }

  private logSQL(sql: string, args: QueryArg[]) {
    log(this.logger, this.options.logLevel)?.debug?.(formatSQL(sql, args));
  }
}
