import { Primitive, Query, QueryObject, QueryArg } from '@src/model/template';

export const asQuery = (query: Query | QueryObject | string): [string] | [string, QueryArg[]] => {
  if (typeof query === 'string') {
    return [query];
  }
  return Array.isArray(query) ? (query as Query) : [query.sql, query.values];
};

type Object = Record<string, any>;

export const deepConvertNullToUndefined = <T extends Object>(
  object: T | T[] | Primitive | Date | undefined
): T | T[] | Primitive | Date | undefined => {
  if (object === null) {
    return undefined;
  }

  if (Array.isArray(object)) {
    return object.map(value => (typeof value === 'object' ? deepConvertNullToUndefined(value) : value)) as T[];
  }

  if (typeof object === 'object' && Object.keys(object).length) {
    return Object.entries(object).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: deepConvertNullToUndefined(value),
      }),
      {}
    ) as T;
  }

  return object;
};
