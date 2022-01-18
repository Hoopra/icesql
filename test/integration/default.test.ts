import { select, registerDefaultConnection } from '@src/connection';
import { connector, databaseOptions, migrateDatabase } from '@test/util';

beforeEach(async () => {
  await migrateDatabase(connector);
});

describe('registerDefaultConnection', () => {
  it('should error any function called without a connection', async () => {
    await expect(select({ query: { id: 1 }, table: 'a' })).rejects.toThrow();
  });

  it('should pass default connection to any function called without a connection', async () => {
    registerDefaultConnection(databaseOptions);
    const result = await select({ query: { id: 1 }, table: 'a' });
    expect(result).toEqual([]);
  });
});
