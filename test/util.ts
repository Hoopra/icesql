import { connectToDatabase } from '@src/connection/init';
import { Connector } from '@src/connection/connection';
import { execute, insert } from '@src/connection/execute';

export type A = { id: number; text: string };

export const migrateDatabase = async (connector: Connector) => {
  await execute(
    `
    CREATE TABLE IF NOT EXISTS a (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      text VARCHAR(255) DEFAULT NULL,
      PRIMARY KEY (id)
  )`,
    connector
  );
  await execute(`TRUNCATE TABLE a`, connector);
};

export const databaseOptions = {
  port: 3309,
  password: 'proot',
  user: 'root',
  database: 'database',
};

export const connector = connectToDatabase(databaseOptions);

export const sampleEntry = { id: 1, text: '' };

export const insertSampleEntry = async (connector: Connector) => await insert({ text: '' }, 'a', connector);
