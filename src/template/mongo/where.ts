import { createListOfSqlParams } from '@src/util/format';
import { QueryOperator, Queryable, TypeWithCompareOperator, QueryObject } from '@src/model/template';

export const where = <T extends Queryable>(QueryOperator: QueryOperator<T>): QueryObject => {
  if (!Object.keys(QueryOperator).length) {
    return { sql: '' };
  }
  const { sql, values } = wherePart(QueryOperator);
  return {
    sql: `WHERE ${sql.trim().replace(/\s\s+/g, ' ').replace(/\( /g, '(')}`,
    values,
  };
};

export const wherePart = <T extends Queryable>(QueryOperator?: QueryOperator<T>, isInner = false): QueryObject => {
  if (!QueryOperator || !Object.keys(QueryOperator).length) {
    return { sql: '' };
  }
  if ('$and' in QueryOperator && '$or' in QueryOperator) {
    throw Error('cannot construct query containing both AND and OR');
  }
  if (!('$and' in QueryOperator) && !('$or' in QueryOperator) && Object.keys(QueryOperator).length < 2) {
    return getFieldQueryPart(QueryOperator);
  }

  const fieldQueries = (QueryOperator.$and ??
    QueryOperator.$or ??
    Object.entries(QueryOperator).map(([key, value]) => ({ [key]: value }))) as Array<QueryOperator<T>>;

  const { sql, values } = fieldQueries.reduce(
    (accumulator, current, i) => {
      const connector = i === 0 ? '' : QueryOperator.$or ? 'OR' : 'AND';
      const entry = wherePart(current, true);
      return {
        ...accumulator,
        sql: `${accumulator.sql} ${connector} ${entry.sql}`,
        values: [...(accumulator.values ?? []), ...(entry.values ?? [])],
      };
    },
    { sql: '' } as QueryObject
  );
  return { sql: isInner && !sql.includes('(') ? `(${sql})` : sql, values };
};

export const getFieldQueryPart = <type extends Queryable>(
  fieldQuery: Partial<TypeWithCompareOperator<type>>
): QueryObject => {
  const [field] = Object.keys(fieldQuery);
  const queryOperator = Object.values(fieldQuery)[0];
  const operator = queryOperator !== null ? Object.keys(queryOperator)[0] : queryOperator;

  const queryValues = Object.values(fieldQuery);
  const value =
    queryValues[0] === null
      ? null
      : typeof queryValues[0] === 'object'
      ? Object.values(queryValues[0])[0]
      : queryValues[0];

  return {
    sql: `${field} ${mapOperator(operator, value)} ${
      Array.isArray(value) ? `(${createListOfSqlParams(value.length)})` : value === null ? 'NULL' : '?'
    }`,
    values: Array.isArray(value) ? value : value === null ? [] : [value],
  };
};

export const mapOperator = (operator: string, value: unknown) => {
  const isNull = value === null;
  switch (operator) {
    case '$ne':
    case '$notEqual':
      return !isNull ? '!=' : 'IS NOT';
    case '$gt':
    case '$greaterThan':
      return '>';
    case '$gte':
    case '$greaterThanEqual':
      return '>=';
    case '$lt':
    case '$lessThan':
      return '<';
    case '$lte':
    case '$lessThanEqual':
      return '<=';
    case '$in':
      return 'IN';
    case '$nin':
    case '$notIn':
      return 'NOT IN';
    case '$like':
      return 'LIKE';
    case '$unlike':
    case '$notLike':
      return 'NOT LIKE';
    case '$eq':
    case '$equal':
    default:
      return !isNull ? '=' : 'IS';
  }
};
