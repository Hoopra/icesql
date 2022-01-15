import { where, wherePart } from '@src/template/mongo/where';

type TestType = { id: number; name: string; created_at: Date };

describe('where', () => {
  it(`should return empty statement if input operator is empty`, () => {
    const statement = where<TestType>({});
    expect(statement).toEqual({ sql: '' });
  });

  it(`should return input as prepared statement`, () => {
    const statement = where<TestType>({ id: 123 });
    expect(statement).toEqual({ sql: `WHERE id = ?`, values: [123] });
  });

  it(`should treat value like $eq`, () => {
    const statement = where<TestType>({ id: 123 });
    const altStatement = where<TestType>({ id: { $eq: 123 } });
    expect(statement).toEqual(altStatement);
  });

  it(`should treat value like $equal`, () => {
    const statement = where<TestType>({ id: 123 });
    const altStatement = where<TestType>({ id: { $equal: 123 } });
    expect(statement).toEqual(altStatement);
  });

  it(`should treat $ne as !=`, () => {
    const statement = where<TestType>({ id: { $ne: 123 } });
    expect(statement).toEqual({ sql: `WHERE id != ?`, values: [123] });
  });

  it(`should treat $ne as NOT NULL if value is null`, () => {
    const statement = where<TestType>({ id: { $ne: null } });
    expect(statement).toEqual({ sql: `WHERE id IS NOT NULL`, values: [] });
  });

  it(`should treat $eq: null as IS NULL`, () => {
    const statement = where<TestType>({ id: null });
    expect(statement).toEqual({ sql: `WHERE id IS NULL`, values: [] });
  });

  it(`should treat $lt as <`, () => {
    const now = new Date();
    const statement = where<TestType>({ created_at: { $lt: now } });
    expect(statement).toEqual({ sql: `WHERE created_at < ?`, values: [now] });
  });

  it(`should treat $lte as <=`, () => {
    const now = new Date();
    const statement = where<TestType>({ created_at: { $lte: now } });
    expect(statement).toEqual({ sql: `WHERE created_at <= ?`, values: [now] });
  });

  it(`should treat $gt as >`, () => {
    const now = new Date();
    const statement = where<TestType>({ created_at: { $gt: now } });
    expect(statement).toEqual({ sql: `WHERE created_at > ?`, values: [now] });
  });

  it(`should treat $gte as >=`, () => {
    const now = new Date();
    const statement = where<TestType>({ created_at: { $gte: now } });
    expect(statement).toEqual({ sql: `WHERE created_at >= ?`, values: [now] });
  });

  it(`should treat $like as LIKE`, () => {
    const now = new Date();
    const statement = where<TestType>({ name: { $like: 'name' } });
    expect(statement).toEqual({ sql: `WHERE name LIKE ?`, values: ['name'] });
  });

  it(`should treat $unlike as NOT LIKE`, () => {
    const now = new Date();
    const statement = where<TestType>({ name: { $unlike: 'name' } });
    expect(statement).toEqual({
      sql: `WHERE name NOT LIKE ?`,
      values: ['name'],
    });
  });

  it(`should treat $in as IN`, () => {
    const ids = [123, 234];
    const statement = where<TestType>({ id: { $in: ids } });
    expect(statement).toEqual({ sql: `WHERE id IN (?,?)`, values: ids });
  });

  it(`should treat $nin as NOT IN`, () => {
    const ids = [123, 234];
    const statement = where<TestType>({ id: { $nin: ids } });
    expect(statement).toEqual({ sql: `WHERE id NOT IN (?,?)`, values: ids });
  });

  it(`should return where statement with AND connection`, () => {
    const statement = where<TestType>({
      $and: [{ id: 123 }, { name: 'name' }],
    });
    expect(statement).toEqual({
      sql: `WHERE id = ? AND name = ?`,
      values: [123, 'name'],
    });
  });

  it(`should default multiple keys to AND`, () => {
    const statement = where<TestType>({
      name: { $unlike: 'name' },
      id: { $ne: null },
    });
    expect(statement).toEqual({
      sql: `WHERE name NOT LIKE ? AND id IS NOT NULL`,
      values: ['name'],
    });
  });

  it(`should return where statement with OR connection`, () => {
    const statement = where<TestType>({
      $or: [{ id: 123 }, { name: 'name' }],
    });
    expect(statement).toEqual({
      sql: `WHERE id = ? OR name = ?`,
      values: [123, 'name'],
    });
  });

  it(`should construct a complicated OR query`, () => {
    const statement = where<TestType>({
      $or: [
        {
          $and: [{ id: 123 }, { name: 'name' }],
        },
        { $and: [{ name: 'name2' }, { id: { $ne: null } }] },
      ],
    });
    expect(statement).toEqual({
      sql: `WHERE (id = ? AND name = ?) OR (name = ? AND id IS NOT NULL)`,
      values: [123, 'name', 'name2'],
    });
  });

  it(`should construct a complicated AND query`, () => {
    const statement = where<TestType>({
      $and: [{ $or: [{ id: 123 }, { name: 'name' }] }, { $or: [{ name: 'name2' }, { id: { $ne: null } }] }],
    });
    expect(statement).toEqual({
      sql: `WHERE (id = ? OR name = ?) AND (name = ? OR id IS NOT NULL)`,
      values: [123, 'name', 'name2'],
    });
  });

  it(`should construct a complicated AND query`, () => {
    const statement = where<TestType>({
      $and: [{ $and: [{ id: 123 }, { name: 'name' }] }, { $or: [{ name: 'name2' }, { id: { $ne: null } }] }],
    });
    expect(statement).toEqual({
      sql: `WHERE (id = ? AND name = ?) AND (name = ? OR id IS NOT NULL)`,
      values: [123, 'name', 'name2'],
    });
  });

  it(`should throw error if specifier contains both $and and $or`, () => {
    expect(() =>
      (where as any)({
        $or: [{ id: 123 }, { name: 'name' }],
        $and: [{ id: 123 }, { name: 'name' }],
      })
    ).toThrowError();
  });
});

describe('wherePart', () => {
  it(`should return empty statement if input operator is empty`, () => {
    expect(wherePart<TestType>()).toEqual({ sql: '' });
    expect(wherePart<TestType>({})).toEqual({ sql: '' });
  });
});
