const { execSync } = require('child_process');
const waitOn = require('wait-on');

const args = process.argv.slice(2);
const [suite] = args;
if (!['all', 'integration'].includes(suite)) {
  throw Error(`invalid suite: ${suite}`);
}

const keepAlive = args.slice(1).includes('--keep-alive');
const validArgs = args
  .slice(1)
  .filter(value => value !== '--keep-alive')
  .join(' ');

const DB_HOST = 'localhost';
const DB_PORT = 3309;

process.env.DB_HOST = DB_HOST;
process.env.DB_PORT = DB_PORT;
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'proot';

const flags = `--passWithNoTests --runInBand --forceExit ${validArgs}`;
const testCommand = `cross-env jest -c jest.config.${suite}.js ${flags}`;

const exec = command => execSync(command, { stdio: 'inherit' });

const executeTest = async () => {
  console.log('start test stack');
  const composeFile = `${__dirname}/docker-compose.yaml`;
  const finalize = () => {
    if (!keepAlive) {
      exec(`docker-compose -f ${composeFile} down`);
    }
  };
  exec(`docker-compose -f ${composeFile} up -d`);

  try {
    console.log('wait for resources to come up');

    await waitOn({ delay: 20e3, tcpTimeout: 15e3, resources: [`tcp:${DB_HOST}:${DB_PORT}`] });

    execSync(testCommand, { stdio: [0, 1, 2] });
  } catch (error) {
    finalize();
    console.error(error);
    console.error('tests failed');
    process.exit(1);
  }
  finalize();
};

executeTest();
