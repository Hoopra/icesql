export type CompareOperator<VT> = VT extends number | Date
  ? {
      $eq: VT | null; // equal
      $ne: VT | null; // not equal
      $lt: VT; // less than
      $gt: VT; // greater than
      $lte: VT; // less than equal
      $gte: VT; // greater than equal
      $in: Array<VT>; // in
      $nin: Array<VT>; // not in
      $equal: VT | null;
      $notEqual: VT | null;
      $lessThan: VT;
      $greaterThan: VT;
      $lessThanEqual: VT;
      $greaterThanEqual: VT;
      $notIn: Array<VT>;
    }
  : {
      $eq: VT | null; // equal
      $neq: VT | null; // not equal
      $like: VT; // like
      $unlike: VT; // not like
      $in: Array<VT>; // in
      $nin: Array<VT>; // not in
      $equal: VT | null;
      $notEqual: VT | null;
      $notLike: VT;
      $notIn: Array<VT>;
    };

export type Queryable = Record<string, unknown>;

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type TypeWithCompareOperator<T extends Queryable> = {
  [K in keyof T]: Partial<CompareOperator<T[K]>> | T[K] | null;
};

export type OperatorValue<T extends Queryable> =
  | RequireOnlyOne<TypeWithCompareOperator<T>>
  | Partial<TypeWithCompareOperator<T>>
  | LogicalOperator<T>;

export type LogicalOperator<T extends Queryable> =
  | { $or: Array<LogicalOperator<T>> | Array<RequireOnlyOne<TypeWithCompareOperator<T>>>; $and?: undefined }
  | { $and: Array<LogicalOperator<T>> | Array<RequireOnlyOne<TypeWithCompareOperator<T>>>; $or?: undefined };

export type QueryOptions<T extends Queryable> = {
  $sort?: Order<T>;
  $limit?: number;
  $projection?: QueryProjection<T>;
};

export type Order<T extends Queryable> = Partial<Record<keyof T, 1 | -1>>;

export type QueryProjection<T extends Queryable> = Array<Partial<keyof T>>;
