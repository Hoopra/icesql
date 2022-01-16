import { query, execute, queryOne, queryOneRequired, queryRequired } from '@src/connection';
import { connector, insertSampleEntry, migrateDatabase, sampleEntry } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

describe('query', () => {
  it(`should execute a query on the database`, async () => {
    const result = await query(`SELECT * FROM a`, connector);
    expect(result).toEqual([]);
  });

  it(`should throw error if not used for querying`, async () => {
    await expect(query(`DELETE FROM a`, connector)).rejects.toThrowError();
  });

  it(`should throw error for invalid SQL`, async () => {
    await expect(execute(`SELECT`, connector)).rejects.toThrowError();
  });

  it(`should return array of objects from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await query(`SELECT * FROM a`, connector);
    expect(result).toEqual([sampleEntry]);
  });
});

describe('queryRequired', () => {
  it(`should throw error if nothing is found`, async () => {
    await expect(queryRequired(`SELECT * FROM a`, connector)).rejects.toThrowError();
  });

  it(`should throw error if nothing is found`, async () => {
    await expect(queryRequired({ query: { id: 1 }, table: 'a' }, connector)).rejects.toThrowError();
  });

  it(`should return array of objects from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await queryRequired(`SELECT * FROM a`, connector);
    expect(result).toEqual([sampleEntry]);
  });
});

describe('queryOne', () => {
  it(`should execute a query on the database`, async () => {
    const result = await queryOne(`SELECT * FROM a`, connector);
    expect(result).toEqual(undefined);
  });

  it(`should return object from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await queryOne(`SELECT * FROM a`, connector);
    expect(result).toEqual(sampleEntry);
  });
});

describe('queryOneRequired', () => {
  it(`should throw error if nothing is found`, async () => {
    await expect(queryOneRequired(`SELECT * FROM a`, connector)).rejects.toThrowError();
  });

  it(`should return object from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await queryOneRequired(`SELECT * FROM a`, connector);
    expect(result).toEqual(sampleEntry);
  });
});
