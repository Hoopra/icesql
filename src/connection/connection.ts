import { Pool, PoolConnection, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';

import { QueryObject, QueryArg, Queryable, QueryOperator } from '@src/model/template';
import { BufferOptions, GenericOptions, Logger } from '@src/model/connection';
import { log } from '@src/connection/logger';

import { asQuery, deepConvertNullToUndefined } from '@src/util/convert';
import { stringifyBufferValues } from '@src/util/buffer';
import { formatSQL } from '@src/util/format';
import { find, insert, remove, update as updateStatement } from '@src/template/mongo';

export type SpecificOperator<T extends Queryable> = { query: QueryOperator<T>; table: string; updated?: Partial<T> };

export type Connector = Connection | Pool | Promise<Connection | Pool>;

const convertNullValuesToUndefined = <T extends Object | Object[]>(entity: T, enabled = false): T => {
  return enabled ? (deepConvertNullToUndefined(entity) as T) : entity;
};

export class Connection {
  conn: Pool | PoolConnection;
  logger?: Logger | typeof console;

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
  public async query<T extends Queryable = RowDataPacket>(
    operator: QueryObject | string | SpecificOperator<T>,
    bufferOptions: BufferOptions = {}
  ): Promise<T[]> {
    const { sql, values } =
      typeof operator !== 'string' && 'table' in operator ? find(operator.query, operator.table) : asQuery(operator);

    this.logSQL(sql, values);
    const response = await this.exec(sql, values);
    if (!Array.isArray(response)) {
      throw Error(
        'Return type error. query() should only be used for SELECT. For INSERT, UPDATE, DELETE and SET use execute()'
      );
    }

    const unbuffered = stringifyBufferValues(response as T[], bufferOptions ?? this.options.buffer);
    return convertNullValuesToUndefined<T[]>(unbuffered, Boolean(this.options.nullToUndefined));
  }

  public async queryRequired<T extends Queryable = RowDataPacket>(
    query: QueryObject | string | SpecificOperator<T>,
    errorMessage?: string,
    bufferOptions: BufferOptions = {}
  ): Promise<[T] & T[]> {
    const result = await this.query(query, bufferOptions ?? this.options.buffer);
    if (!result?.length) {
      throwRequiredError(query, errorMessage);
    }
    return result as [T] & T[];
  }

  public async queryOne<T extends Queryable = RowDataPacket>(
    query: QueryObject | string | SpecificOperator<T>,
    bufferOptions: BufferOptions = {}
  ): Promise<T | null> {
    const [result] = await this.query(query, bufferOptions ?? this.options.buffer);
    return result as T;
  }

  public async queryOneRequired<T extends Queryable = RowDataPacket>(
    query: QueryObject | string | SpecificOperator<T>,
    errorMessage?: string,
    bufferOptions: BufferOptions = {}
  ): Promise<T> {
    const result = await this.queryOne(query, bufferOptions ?? this.options.buffer);
    if (!result) {
      throwRequiredError(query, errorMessage);
    }
    return result as T;
  }

  /**
   * Use this for generic operations.
   */
  public async execute(operator: QueryObject | string): Promise<ResultSetHeader> {
    const { sql, values } = asQuery(operator);

    this.logSQL(sql, values);
    const response = await this.exec(sql, values);

    return response as ResultSetHeader;
  }

  /**
   * INSERT one or more entries
   */
  public async insert<T extends Queryable = RowDataPacket>(object: T | T[], table: string): Promise<ResultSetHeader> {
    const { sql, values } = insert(object, table);

    this.logSQL(sql, values);
    const response = await this.exec(sql, values);

    return response as ResultSetHeader;
  }

  /**
   * DELETE one or more entries
   */
  public async remove<T extends Queryable = RowDataPacket>(
    operator: QueryObject | string | SpecificOperator<T>
  ): Promise<ResultSetHeader> {
    const { sql, values } =
      typeof operator !== 'string' && 'table' in operator ? remove(operator.query, operator.table) : asQuery(operator);

    this.logSQL(sql, values);
    const response = await this.exec(sql, values);

    return response as ResultSetHeader;
  }

  /**
   * UPDATE one or more entries
   */
  public async update<T extends Queryable = RowDataPacket>(
    operator: Required<SpecificOperator<T>>
  ): Promise<ResultSetHeader> {
    const { query, table, updated } = operator;
    const { sql, values } = updateStatement(query, table, updated);

    this.logSQL(sql, values);
    const response = await this.exec(sql, values);

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
    args: QueryArg[] = []
  ): Promise<RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader> {
    try {
      const [response] = await this.conn.execute(sql, args);
      return response;
    } catch (err) {
      log(this.logger, this.options.logLevel)?.error?.(`${err} - failing SQL: ${formatSQL(sql, args)}`);
      throw typeof err === 'string' ? Error(err) : (err as Error);
    }
  }

  private logSQL(sql: string, args?: QueryArg[]) {
    log(this.logger, this.options.logLevel)?.debug?.(formatSQL(sql, args ?? []));
  }
}

const throwRequiredError = <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  errorMessage?: string
) => {
  if (typeof operator !== 'string' && 'table' in operator) {
    const { query, table } = operator;
    throw Error(errorMessage ?? `no results found for query ${JSON.stringify(find(query, table))}`);
  }

  throw Error(errorMessage ?? `no results found for query ${JSON.stringify(asQuery(operator))}`);
};
