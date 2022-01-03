import { Client } from 'ssh2';
import { createPool, Pool, PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Connection } from './connection';
import { GenericOptions, SSHConfig } from './types';
import { log } from './logger';
import { Query, QueryObject } from '@src/model/template';

export const connectToPool = async (
  poolOptions: PoolOptions,
  sshConfig?: SSHConfig,
  options: GenericOptions = {}
): Promise<[Pool, Client?]> => {
  if (!sshConfig) {
    return [createNewPool(poolOptions, undefined, options)];
  }

  const sshClient = new Client();
  const localhost = '127.0.0.1';

  return new Promise((resolve, reject) => {
    sshClient
      .on('ready', async () => {
        sshClient.forwardOut(localhost, 3306, poolOptions.host!, poolOptions.port!, async (err, stream) => {
          if (err) {
            reject(err);
          }
          resolve([createNewPool(poolOptions, stream, options), sshClient]);
        });
      })
      .connect(sshConfig);
  });
};

export const createNewPool = (poolOptions: PoolOptions, stream?: any, { logLevel, logger }: GenericOptions = {}) => {
  const pool = createPool({ ...poolOptions, stream });
  pool.on('connection', connection => connection.query('SET SESSION transaction_isolation="READ-COMMITTED"'));
  pool.on('enqueue', () => log(logger, logLevel)?.debug('MySQL - Waiting for available connection slot'));
  pool.on('acquire', connection => log(logger, logLevel)?.debug('Connection %d acquired', connection.threadId));
  pool.on('release', connection => log(logger, logLevel)?.debug('Connection %d released', connection.threadId));
  return pool;
};

export const connectToDatabase = async (config: PoolOptions, sshConfig?: SSHConfig) => {
  const poolOptions: PoolOptions = {
    ...config,
    waitForConnections: true,
    maxPreparedStatements: 20,
    queueLimit: 0,
    stringifyObjects: false,
    connectionLimit: sshConfig ? 1 : undefined,
  };

  let pool: Pool | null = null;
  const getPool = async () => {
    if (!pool) {
      pool = (await connectToPool(poolOptions, sshConfig))[0];
    }
    return pool!;
  };

  return await getPool();
};

const getConnection = async (
  connector: Connection | Pool | Promise<Connection | Pool>,
  options?: GenericOptions
): Promise<Connection> => {
  if (connector instanceof Promise) {
    return getConnection(await connector);
  }
  if (connector instanceof Connection) {
    return connector;
  }
  return new Connection(connector);
};

/**
 * SELECT from database. The expected result will be an array of T (default RowDataPacket)
 * @param query
 * @param connection
 */
export const query = async <T extends { [key: string]: any } = RowDataPacket>(
  query: Query | QueryObject | string,
  connector: Connection | Pool | Promise<Connection | Pool>,
  options: GenericOptions = {}
): Promise<T[]> => (await getConnection(connector, options)).query(query);

/**
 * SELECT from database. The expected result will be an array of T (default RowDataPacket).
 * Errors if no results are found.
 * @param query
 * @param connection
 */
export const queryRequired = async <T extends { [key: string]: any } = RowDataPacket>(
  query: Query | QueryObject | string,
  connector: Connection | Pool | Promise<Connection | Pool>,
  errorMessage?: string,
  options: GenericOptions = {}
): Promise<[T] & T[]> => (await getConnection(connector, options)).queryRequired(query, errorMessage);

/**
 * SELECT one entity from database. The expected result will be an array of T (default RowDataPacket).
 * @param query
 * @param connection
 */
export const queryOne = async <T extends { [key: string]: any } = RowDataPacket>(
  query: Query | QueryObject | string,
  connector: Connection | Pool | Promise<Connection | Pool>,
  options: GenericOptions = {}
): Promise<T | null> => {
  return await (await getConnection(connector, options)).queryOne<T>(query);
};

/**
 * SELECT one entity from database. The expected result will be an array of T (default RowDataPacket).
 * Errors if no results are found.
 * @param query
 * @param connection
 */
export const queryOneRequired = async <T extends { [key: string]: any } = RowDataPacket>(
  query: Query | QueryObject | string,
  connector: Connection | Pool | Promise<Connection | Pool>,
  errorMessage?: string,
  options: GenericOptions = {}
): Promise<T> => {
  return (await getConnection(connector, options)).queryOneRequired<T>(query, errorMessage);
};

/**
 * Use execute when doing INSERT, UPDATE, DELETE or SET. The expected result will be a ResultSetHeader
 * @param query
 * @param connection
 */
export const execute = async (
  query: Query | QueryObject | string,
  connector: Connection | Pool | Promise<Connection | Pool>,
  options: GenericOptions = {}
): Promise<ResultSetHeader> => (await getConnection(connector, options)).execute(query);

/**
 * Starts or continues a transaction. Automatically rolls back changes if an error occurs.
 * @param func method to run during transaction
 * @param transActionConnection active transaction connection to use
 */
export const transaction = async <T>(
  func: (conn: Connection) => Promise<T>,
  c: Connection | Pool | Promise<Connection | Pool>,
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
