import { SQLTemplate } from '@src/model/template';
import { createListOfSqlParams } from '@src/util/format';
import { OperatorValue, Queryable, TypeWithCompareOperator } from './types';

export const where = <T extends Queryable>(operatorValue: OperatorValue<T>): SQLTemplate => {
  if (!Object.keys(operatorValue).length) {
    return { sql: '', values: [] };
  }
  const { sql, values } = wherePart(operatorValue);
  return {
    sql: `WHERE ${sql
      .trim()
      .replace(/\s\s+/g, ' ')
      .replace(/\( /g, '(')}`,
    values,
  };
};

export const wherePart = <T extends Queryable>(operatorValue?: OperatorValue<T>, isInner = false): SQLTemplate => {
  if (!operatorValue) {
    return { sql: '', values: [] };
  }
  if ('$and' in operatorValue && '$or' in operatorValue) {
    throw Error('cannot construct query containing both AND and OR');
  }
  if (!('$and' in operatorValue) && !('$or' in operatorValue) && Object.keys(operatorValue).length < 2) {
    return getFieldQueryPart(operatorValue);
  }

  const fieldQueries = (operatorValue.$and ??
    operatorValue.$or ??
    Object.entries(operatorValue).map(([key, value]) => ({ [key]: value }))) as Array<OperatorValue<T>>;

  const { sql, values } = fieldQueries.reduce(
    (accumulator, current, i) => {
      const connector = i === 0 ? '' : operatorValue.$or ? 'OR' : 'AND';
      const entry = wherePart(current, true);
      return {
        ...accumulator,
        sql: `${accumulator.sql} ${connector} ${entry.sql}`,
        values: [...accumulator.values, ...entry.values],
      };
    },
    { sql: '', values: [] } as SQLTemplate
  );
  return { sql: isInner && !sql.includes('(') ? `(${sql})` : sql, values };
};

export const getFieldQueryPart = <type extends Queryable>(
  fieldQuery: Partial<TypeWithCompareOperator<type>>
): SQLTemplate => {
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
