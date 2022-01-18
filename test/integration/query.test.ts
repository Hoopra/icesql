import { select, execute, selectOne, selectOneRequired, selectRequired } from '@src/connection';
import { connector, insertSampleEntry, migrateDatabase, sampleEntry } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

describe('query', () => {
  it(`should execute a query on the database`, async () => {
    const result = await select(`SELECT * FROM a`, connector);
    expect(result).toEqual([]);
  });

  it(`should throw error if not used for querying`, async () => {
    await expect(select(`DELETE FROM a`, connector)).rejects.toThrowError();
  });

  it(`should throw error for invalid SQL`, async () => {
    await expect(execute(`SELECT`, connector)).rejects.toThrowError();
  });

  it(`should return array of objects from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await select(`SELECT * FROM a`, connector);
    expect(result).toEqual([sampleEntry]);
  });
});

describe('selectRequired', () => {
  it(`should throw error if nothing is found`, async () => {
    await expect(selectRequired(`SELECT * FROM a`, connector)).rejects.toThrowError();
  });

  it(`should throw error if nothing is found`, async () => {
    await expect(selectRequired({ query: { id: 1 }, table: 'a' }, connector)).rejects.toThrowError();
  });

  it(`should return array of objects from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await selectRequired(`SELECT * FROM a`, connector);
    expect(result).toEqual([sampleEntry]);
  });
});

describe('selectOne', () => {
  it(`should execute a query on the database`, async () => {
    const result = await selectOne(`SELECT * FROM a`, connector);
    expect(result).toEqual(undefined);
  });

  it(`should return object from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await selectOne(`SELECT * FROM a`, connector);
    expect(result).toEqual(sampleEntry);
  });
});

describe('selectOneRequired', () => {
  it(`should throw error if nothing is found`, async () => {
    await expect(selectOneRequired(`SELECT * FROM a`, connector)).rejects.toThrowError();
  });

  it(`should return object from the database`, async () => {
    await insertSampleEntry(connector);
    const result = await selectOneRequired(`SELECT * FROM a`, connector);
    expect(result).toEqual(sampleEntry);
  });
});
