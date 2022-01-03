import { Connection } from '@src/connection';
import { execute } from '@src/connection/init';

export const migrateDatabase = async (connector: Connection) => {
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

export const insertSampleEntry = async (connector: Connection) =>
  await execute(`INSERT INTO a (text) VALUES ("")`, connector);
