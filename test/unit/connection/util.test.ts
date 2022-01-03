import { asQuery, deepConvertNullToUndefined } from '@src/connection/util';

const insertString = 'INSERT INTO a (id) VALUES (?)';

describe('asQuery', () => {
  it(`should format string as query tuple`, () => {
    expect(asQuery(insertString)).toEqual([insertString]);
  });

  it(`should format query object as query tuple`, () => {
    expect(asQuery({ sql: insertString, values: ['b'] })).toEqual([insertString, ['b']]);
  });

  it(`should return query tuple as is`, () => {
    expect(asQuery([insertString, ['b']])).toEqual([insertString, ['b']]);
  });
});

describe('deepConvertNullToUndefined', () => {
  it(`should convert null values to undefined`, () => {
    const entity = { key: null };
    expect(deepConvertNullToUndefined(entity)).toEqual({ key: undefined });
  });

  it(`should work on deeper levels`, () => {
    const entity = {
      key: null,
      deep1: { deep2: { deepKey: null } },
    };
    expect(deepConvertNullToUndefined(entity)).toEqual({
      deep1: { deep2: { deepKey: undefined } },
      key: undefined,
    });
  });

  it(`should not modify values other than null`, () => {
    const entity = {
      key: null,
      date: new Date(0),
      string: '',
      number: 0,
    };
    expect(deepConvertNullToUndefined(entity)).toEqual({ ...entity, key: undefined });
  });

  it(`should work for arrays`, () => {
    const entity = {
      key: null,
      deep1: { deep2: { deepKey: null } },
    };
    expect(deepConvertNullToUndefined([entity, entity])).toEqual([
      {
        deep1: { deep2: { deepKey: undefined } },
        key: undefined,
      },
      {
        deep1: { deep2: { deepKey: undefined } },
        key: undefined,
      },
    ]);
  });
});
