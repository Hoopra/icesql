import { find, formatParameter, insert, remove, update } from '@src/template';

type TestType = { id: number; name: string; created_at: Date };

describe('find', () => {
  it(`should return basic SELECT statement`, () => {
    const statement = find<TestType>(undefined, 'user');
    expect(statement).toEqual({
      sql: `SELECT * FROM user`,
    });
  });

  it(`should return SELECT statement with projection as prepared statement`, () => {
    const statement = find<TestType>({ id: 123 }, 'user', { $projection: ['id', 'name'] });
    expect(statement).toEqual({
      sql: `SELECT id, name FROM user WHERE id = ?`,
      values: [123],
    });
  });

  it(`should return SELECT statement with limit`, () => {
    const statement = find<TestType>({ id: 123 }, 'user', { $limit: 2 });
    expect(statement).toEqual({
      sql: `SELECT * FROM user WHERE id = ? LIMIT 2`,
      values: [123],
    });
  });

  it(`should return SELECT statement with order`, () => {
    const statement = find<TestType>({ id: 123 }, 'user', { $sort: { name: 1, id: -1 } });
    expect(statement).toEqual({
      sql: `SELECT * FROM user WHERE id = ? ORDER BY name ASC, id DESC`,
      values: [123],
    });
  });
});

describe('remove', () => {
  it(`should return basic DELETE statement`, () => {
    const statement = remove<TestType>(undefined, 'user');
    expect(statement).toEqual({ sql: `DELETE FROM user` });
  });

  it(`should return DELETE statement with WHERE condition`, () => {
    const now = new Date();
    const statement = remove<TestType>({ name: 'name', created_at: { $gt: now } }, 'user');
    expect(statement).toEqual({
      sql: `DELETE FROM user WHERE name = ? AND created_at > ?`,
      values: ['name', now],
    });
  });
});

describe('update', () => {
  it(`should return basic UPDATE statement`, () => {
    const statement = update<TestType>({ id: 123 }, 'user', { name: 'name' });
    expect(statement.sql).toBe('UPDATE user SET name = ? WHERE id = ?');
    expect(statement).toEqual({
      sql: `UPDATE user SET name = ? WHERE id = ?`,
      values: ['name', 123],
    });
  });

  it(`should return DELETE statement with WHERE condition`, () => {
    const now = new Date();
    const statement = remove<TestType>({ name: 'name', created_at: { $gt: now } }, 'user');
    expect(statement).toEqual({
      sql: `DELETE FROM user WHERE name = ? AND created_at > ?`,
      values: ['name', now],
    });
  });
});

describe('insert', () => {
  it(`should return insert statement from array of objects`, async () => {
    expect(insert([{ a: 'a', b: 2 }], 'table')).toEqual({
      sql: `INSERT INTO table (a,b) VALUES (?,?);`,
      values: ['a', 2],
    });
    const statement = insert(
      [
        { a: 'a', b: 2 },
        { a: 'c', b: 5 },
      ],
      'table'
    );
    expect(statement).toEqual({ sql: `INSERT INTO table (a,b) VALUES (?,?),(?,?);`, values: ['a', 2, 'c', 5] });
  });

  it(`should work for array of objects with different sets of keys and treat undefined as 'NULL'`, async () => {
    expect(insert([{ a: 'a', b: 2 }], 'table')).toEqual({
      sql: `INSERT INTO table (a,b) VALUES (?,?);`,
      values: ['a', 2],
    });
    const statement = insert(
      [
        { a: 'a', b: 2, c: null, e: undefined, f: 0 },
        { a: 'c', b: 5, c: 'hello', d: 'hello' },
      ],
      'table'
    );
    expect(statement).toEqual({
      sql: `INSERT INTO table (a,b,c,e,f,d) VALUES (?,?,?,?,?,?),(?,?,?,?,?,?);`,
      values: ['a', 2, null, null, 0, null, 'c', 5, 'hello', null, null, 'hello'],
    });
  });

  it(`should return insert statement from single object`, async () => {
    expect(insert({ a: 'a', b: 2 }, 'table')).toEqual({
      sql: `INSERT INTO table (a,b) VALUES (?,?);`,
      values: ['a', 2],
    });
  });
});

describe('formatParameter', () => {
  it(`should return input value for Date object`, () => {
    const date = new Date(0);
    expect(formatParameter(date)).toEqual(date);
  });

  it(`should return stringified value for object`, () => {
    expect(formatParameter({ hello: 1 })).toBe('{"hello":1}');
  });
});
