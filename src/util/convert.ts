import { Primitive, QueryObject } from '@src/model/template';

type Object = Record<string, any>;

export const asQuery = (query: QueryObject | string): QueryObject =>
  typeof query === 'string' ? { sql: query } : query;

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
