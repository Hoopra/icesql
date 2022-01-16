import { query, transaction } from '@src/connection';
import { connector, insertSampleEntry, migrateDatabase, sampleEntry } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

describe('transaction', () => {
  it(`should execute commands in a transaction`, async () => {
    await transaction(async conn => {
      await insertSampleEntry(conn);
      await conn.execute(`DELETE FROM a`);
    }, connector);
    expect(await query(`SELECT * FROM a`, connector)).toEqual([]);
  });

  it(`should roll back if an error occurs`, async () => {
    await insertSampleEntry(connector);
    try {
      await transaction(async conn => {
        await conn.execute(`DELETE FROM a`);
        throw Error();
      }, connector);
    } catch (error) {}
    expect(await query(`SELECT * FROM a`, connector)).toEqual([sampleEntry]);
  });

  it(`should concatenate multiple transactions in succession`, async () => {
    await transaction(async conn1 => {
      await insertSampleEntry(conn1);
      await conn1.execute(`DELETE FROM a`);
      await transaction(async conn2 => {
        await insertSampleEntry(conn2);
      }, conn1);
    }, connector);
    expect(await query(`SELECT * FROM a`, connector)).toEqual([{ ...sampleEntry, id: 2 }]);
  });
});
