import { SQL } from '@src/template/tag';
import 'jest';

describe('sql template', () => {
  it(`should return input as prepared statement`, () => {
    expect({ ...SQL`SELECT * FROM table WHERE id = ${1}` }).toEqual({
      statement: `SELECT * FROM table WHERE id = ?`,
      arguments: [1],
    });
  });

  it(`should properly handle array input`, () => {
    expect({ ...SQL`SELECT * FROM table WHERE id IN (${[1, 2, 3, 4]}) AND name = ${'hello'}` }).toEqual({
      statement: `SELECT * FROM table WHERE id IN (?,?,?,?) AND name = ?`,
      arguments: [1, 2, 3, 4, 'hello'],
    });
  });

  it(`should properly handle date input`, () => {
    const date = new Date(0);
    expect({ ...SQL`SELECT * FROM table WHERE created_at = ${date}` }).toEqual({
      statement: `SELECT * FROM table WHERE created_at = ?`,
      arguments: [date],
    });
  });

  it(`should handle concatenation of statements`, () => {
    const ids = [1, 2, 3, 4];
    const statement = SQL`SELECT * FROM (${SQL`SELECT * FROM table WHERE id IN (${ids}) AND name = ${'hello'}`})`;
    expect({ ...statement }).toEqual({
      statement: `SELECT * FROM (SELECT * FROM table WHERE id IN (?,?,?,?) AND name = ?)`,
      arguments: [1, 2, 3, 4, 'hello'],
    });
  });

  it(`should handle empty strings in args`, () => {
    expect({ ...SQL`SELECT * FROM table WHERE value = ${''}` }).toEqual({
      statement: `SELECT * FROM table WHERE value = ?`,
      arguments: [''],
    });
  });

  it(`should handle nulls in args`, () => {
    expect({ ...SQL`INSERT INTO table SET value = ${null}` }).toEqual({
      statement: `INSERT INTO table SET value = ?`,
      arguments: [null],
    });
  });

  it(`should throw Error when undefined in args`, () => {
    expect(() => ({ ...SQL`INSERT INTO table SET value = ${undefined}` })).toThrowError(
      'MySQL arguments cannot contain undefined'
    );
  });
});
