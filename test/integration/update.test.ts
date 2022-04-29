import { select, insert, update } from '@src/connection';
import { A, connector, migrateDatabase } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

const object = { text: 'text' };
const table = 'a';

describe('update', () => {
  it(`should error if no objects are passed`, async () => {
    await expect(update({ query: {}, table, updated: {} }, connector)).rejects.toThrowError();

    const rows = await select(`SELECT * FROM ${table}`, connector);
    expect(rows.length).toBe(0);
  });

  it(`should update a single row`, async () => {
    await insert({ object, table }, connector);
    await update<A>({ query: { id: 1 }, table, updated: { text: 'new text' } }, connector);

    const rows = await select(`SELECT * FROM a`, connector);
    expect(rows.length).toBe(1);
    expect(rows[0]?.text).toBe('new text');
  });

  it(`should set value to 'NULL'`, async () => {
    await insert({ object, table }, connector);
    await update<A>({ query: { id: 1 }, table, updated: { text: null } }, connector);

    const rows = await select(`SELECT * FROM a`, connector);
    expect(rows.length).toBe(1);
    expect(rows[0]?.text).toBeNull();
  });
});
