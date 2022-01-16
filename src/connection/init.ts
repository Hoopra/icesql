import { Client } from 'ssh2';
import { createPool, Pool, PoolOptions } from 'mysql2/promise';

import { Connection, Connector } from '@src/connection/connection';
import { log } from '@src/connection/logger';
import { GenericOptions, SSHConfig } from '@src/model/connection';

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

export const getConnection = async (connector: Connector, options?: GenericOptions): Promise<Connection> => {
  if (connector instanceof Promise) {
    return getConnection(await connector, options);
  }
  if (connector instanceof Connection) {
    return connector;
  }
  return new Connection(connector);
};
