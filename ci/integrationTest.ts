process.env.NODE_ENV = 'test';

import { execSync } from 'child_process';
import { attemptConnection } from './dbWait';

const args = process.argv.slice(2);

const keepAlive = args.includes('--keep-alive');

const composeFile = `${__dirname}/docker-compose.yaml`;
const configFile = `${__dirname}/../jest.config.${args.includes('all') ? 'all' : 'integration'}.js`;

const exec = (command: string) => execSync(command, { stdio: 'inherit' });

const database = 'database';
const host = 'localhost';
const port = '3309';
const password = 'proot';
const user = 'root';

process.env = {
  ...process.env,
  DB_HOST: host,
  DB_PASSWORD: password,
  DB_PORT: port,
  DB_DATABASE: database,
  DB_USERNAME: user,
};

const teardown = (keepAlive: boolean, success = true) => {
  if (!keepAlive) {
    exec(`docker-compose -f ${composeFile} down --remove-orphans --volumes`);
  }
  process.exit(success ? 0 : 1);
};

const integrationTest = async () => {
  console.log('create stack');
  exec(`docker-compose -f ${composeFile} up -d`);

  console.log('wait for database');
  await attemptConnection();

  // console.log('migrate database');
  // execSync(`npm run db-migrate -- up:init`);

  console.log('run test');
  try {
    exec(
      `jest -c ${configFile} --runInBand --forceExit ${args
        .filter(value => !['--', '--keep-alive', 'all'].includes(value))
        .slice(0, 1)
        .join(' ')}`
    );
  } catch (error) {
    teardown(keepAlive, false);
  }

  teardown(keepAlive, true);
};
integrationTest();
