import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { Queryable, QueryObject } from '@src/model/template';
import { GenericOptions } from '@src/model/connection';
import { getConnection } from '@src/connection/init';
import { Connection, Connector, SpecificOperator } from '@src/connection/connection';
import { log } from '@src/connection/logger';

/**
 * SELECT from database. The expected result will be an array of T (default RowDataPacket)
 */
export const query = async <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<T[]> => {
  return (await getConnection(connector, options)).query(operator);
};

/**
 * SELECT from database. The expected result will be an array of T (default RowDataPacket).
 * Errors if no results are found.
 */
export const queryRequired = async <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  errorMessage?: string,
  options: GenericOptions = {}
): Promise<[T] & T[]> => {
  return (await getConnection(connector, options)).queryRequired(operator, errorMessage);
};

/**
 * SELECT one entity from database. The expected result will be an array of T (default RowDataPacket).
 */
export const queryOne = async <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<T | null> => {
  return (await getConnection(connector, options)).queryOne(operator);
};

/**
 * SELECT one entity from database. The expected result will be an array of T (default RowDataPacket).
 * Errors if no results are found.
 */
export const queryOneRequired = async <T extends Queryable = RowDataPacket>(
  query: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  errorMessage?: string,
  options: GenericOptions = {}
): Promise<T> => {
  return (await getConnection(connector, options)).queryOneRequired<T>(query, errorMessage);
};

/**
 * Use this for generic operations.
 */
export const execute = async (
  query: QueryObject | string,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => {
  return (await getConnection(connector, options)).execute(query);
};

/**
 * INSERT one or more entries
 */
export const insert = async <T extends Queryable = RowDataPacket>(
  object: T | T[],
  table: string,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => (await getConnection(connector, options)).insert(object, table);

/**
 * UPDATE one or more entries
 */
export const update = async <T extends Queryable = RowDataPacket>(
  query: Required<SpecificOperator<T>>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => (await getConnection(connector, options)).update(query);

/**
 * INSERT one or more entries
 */
export const remove = async <T extends Queryable = RowDataPacket>(
  query: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => (await getConnection(connector, options)).remove(query);

/**
 * Starts or continues a transaction. Automatically rolls back changes if an error occurs.
 */
export const transaction = async <T>(
  func: (conn: Connection) => Promise<T>,
  c: Connector,
  { logLevel, nullToUndefined }: GenericOptions = {}
): Promise<T> => {
  if (c instanceof Promise) {
    return await transaction(func, await c);
  }
  if (c instanceof Connection) {
    return func(await getConnection(c, { logLevel }));
  }
  const conn = await c.getConnection();
  await conn.beginTransaction();
  const connection = new Connection(conn, { logLevel, nullToUndefined });
  try {
    const funcReturn = await func(connection);
    await conn.commit();
    return funcReturn;
  } catch (err) {
    log(connection.options.logger, connection.options.logLevel)?.error(err);
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
