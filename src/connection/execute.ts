import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { Queryable, QueryObject } from '@src/model/template';
import { GenericOptions } from '@src/model/connection';
import { getConnection } from '@src/connection/init';
import { Connection, Connector, InsertOperator, SpecificOperator } from '@src/connection/connection';
import { log } from '@src/connection/logger';

/**
 * SELECT rows from database.
 */
export const select = async <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<T[]> => {
  return (await getConnection(connector, options)).query(operator);
};

/**
 * SELECT rows from database.
 * Errors if no results are found.
 */
export const selectRequired = async <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  errorMessage?: string,
  options: GenericOptions = {}
): Promise<[T] & T[]> => {
  return (await getConnection(connector, options)).queryRequired(operator, errorMessage);
};

/**
 * SELECT one row from database.
 */
export const selectOne = async <T extends Queryable = RowDataPacket>(
  operator: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<T | null> => {
  return (await getConnection(connector, options)).queryOne(operator);
};

/**
 * SELECT one row from database.
 * Errors if no results are found.
 */
export const selectOneRequired = async <T extends Queryable = RowDataPacket>(
  query: QueryObject | string | SpecificOperator<T>,
  connector?: Connector,
  errorMessage?: string,
  options: GenericOptions = {}
): Promise<T> => {
  return (await getConnection(connector, options)).queryOneRequired<T>(query, errorMessage);
};

/**
 * Execute generic operation.
 */
export const execute = async (
  query: QueryObject | string,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => {
  return (await getConnection(connector, options)).execute(query);
};

/**
 * INSERT one or more entries.
 */
export const insert = async <T extends Queryable = RowDataPacket>(
  operator: InsertOperator<T>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => {
  if (Array.isArray(operator.object) && !operator.object.length) {
    throw Error('no objects to insert');
  }

  return (await getConnection(connector, options)).insert(operator);
};

/**
 * UPDATE one or more entries.
 */
export const update = async <T extends Queryable = RowDataPacket>(
  query: Required<SpecificOperator<T>>,
  connector?: Connector,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => (await getConnection(connector, options)).update(query);

/**
 * DELETE one or more entries.
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
  c?: Connector,
  { logLevel, nullToUndefined }: GenericOptions = {}
): Promise<T> => {
  if (!c) {
    return transaction(func, await getConnection(c));
  }

  if (c instanceof Promise) {
    return await transaction(func, await c);
  }
  if (c instanceof Connection) {
    return func(await getConnection(c, { logLevel }));
  }

  const conn = await c?.getConnection();
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
