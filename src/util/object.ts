export const filterAndMap = <T, S>(array: T[], filter: (e: T) => boolean, mapper: (e: T) => S) =>
  array.reduce((acc, current) => (filter(current) ? [...acc, mapper(current)] : acc), [] as S[]);
