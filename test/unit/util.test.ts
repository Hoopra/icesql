import { formatSQL, createListOfSqlParams } from '@src/util/format';

const queryString = 'SELECT * FROM a';

describe('formatSQL', () => {
  it(`should return escaped SQL statement`, () => {
    expect(formatSQL('INSERT INTO a (id) VALUES (?)', ['b'])).toBe(`INSERT INTO a (id) VALUES ('b')`);
    expect(formatSQL(queryString)).toBe(queryString);
  });

  it(`should return trimmed lines into one line SQL statement`, () => {
    expect(
      formatSQL(
        `INSERT INTO a (id) VALUES (?)
          WHERE id = 3    `,
        ['b']
      )
    ).toBe(`INSERT INTO a (id) VALUES ('b') WHERE id = 3`);
    expect(formatSQL(queryString)).toBe(queryString);
  });
});

describe('createListOfSqlParams', () => {
  it(`should return empty string if count is 0`, () => {
    expect(createListOfSqlParams(0)).toBe('');
  });

  it(`should return a number of '?' characters`, () => {
    expect(createListOfSqlParams(5)).toBe('?,?,?,?,?');
  });
});
