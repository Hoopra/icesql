import { createPool } from 'mysql2/promise';

const pool = () =>
  createPool({
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    connectionLimit: 100,
    waitForConnections: true,
    multipleStatements: true,
    port: Number(process.env.DB_PORT),
  });

export const attemptConnection = (resolve?: () => void): Promise<void> => {
  return new Promise<void>(async innerResolve => {
    try {
      await pool().getConnection();
      (resolve ?? innerResolve)();
    } catch (error) {
      if ((error as Error).message.includes('Access denied for user')) {
        (resolve ?? innerResolve)();
        return;
      }
      await new Promise<void>(async resolve => setTimeout(resolve, 3e3));
      return attemptConnection(resolve ?? innerResolve);
    }
  });
};
