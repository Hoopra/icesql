import { select, execute, remove, update } from '@src/connection';
import { A, connector, insertSampleEntry, migrateDatabase } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

describe('execute', () => {
  it(`should execute command`, async () => {
    await insertSampleEntry(connector);
    await execute(`DELETE FROM a`, connector);
    expect((await select(`SELECT * FROM a`, connector)).length).toBe(0);
  });

  it(`should throw error for invalid SQL`, async () => {
    await expect(execute(`DELETE`, connector)).rejects.toThrowError();
  });
});

describe('update', () => {
  it(`should update entry`, async () => {
    await insertSampleEntry(connector);
    await update<A>({ query: { id: 1 }, table: 'a', updated: { text: 'b' } }, connector);
    expect((await select<A>(`SELECT * FROM a`, connector))[0]?.text).toBe('b');
  });
});

describe('remove', () => {
  it(`should remove all entries`, async () => {
    await insertSampleEntry(connector);
    await remove({ query: {}, table: 'a' }, connector);
    expect((await select(`SELECT * FROM a`, connector)).length).toBe(0);
  });

  it(`should remove one entry`, async () => {
    await insertSampleEntry(connector);
    await insertSampleEntry(connector);
    await remove({ query: { id: 1 }, table: 'a' }, connector);
    expect((await select(`SELECT * FROM a`, connector)).length).toBe(1);
  });
});
