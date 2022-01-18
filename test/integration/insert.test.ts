import { select, insert } from '@src/connection';
import { A, connector, insertSampleEntry, migrateDatabase } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

const object = { text: 'text' };
const table = 'a';

describe('insert', () => {
  it(`should error if no objects are passed`, async () => {
    await expect(insert({ object: [], table }, connector)).rejects.toThrowError();

    const rows = await select(`SELECT * FROM a`, connector);
    expect(rows.length).toBe(0);
  });

  it(`should insert a single row`, async () => {
    await insert({ object, table }, connector);

    const rows = await select(`SELECT * FROM a`, connector);
    expect(rows.length).toBe(1);
    expect(rows[0]?.text).toBe('text');
  });

  it(`should insert multiple rows`, async () => {
    await insert({ object: [object, object, object], table }, connector);

    const rows = await select(`SELECT * FROM a`, connector);
    expect(rows.length).toBe(3);
  });
});
