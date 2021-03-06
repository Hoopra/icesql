# icesql

(icicle)

A library to easily query and manipulate SQL databases.

Currently supports only MySQL, but is a work in progress to support all major types of SQL database.

## Installation

### Add package

```
npm i icesql

yarn add icesql
```

`icesql` has typescript typings out of the box.

## Usage

```
const databaseConfig = {
  host: "localhost",
  port: 3306,
  database: "database",
  user: "root",
  password: "root"
};
const connector = connectToDatabase(databaseConfig);
```

If you use only one (or a primary) database connection, instead call the following:

```
registerDefaultConnection(databaseConfig);
```

You can then omit `connector` from any function call in the following.

### Query

```
import { query } from 'icesql';

interface Person {
  id: number;
  name: string;
}

...

async function findPerson(id: number): Promise<Person | undefined> {
  const person = await queryOne<Person>({ query: { id: 1 }, table: 'people' }, connector)
  return person;
}

async function findPeople(): Promise<Person[]> {
  const people = await query<Person>({ query: {}, table: 'people' }, connector)
  return people;
}

```

If you registered a default connection, use:

```
const people = await query<Person>({ query: {}, table: 'people' }) // omit `connector`
return people;
```

### Update

`update` returns `ResultSetHeader` from [mysql2](https://www.npmjs.com/package/mysql2), which is implemented by `icesql`.

```
import { update } from 'icesql';

...

async function updatePerson(id: number, updated: Partial<Person>) {
  const result = await update(
    {
      query: { id },
      table: 'people',
      updated
    },
    connector
  );
  return result;
}

...
await updatePerson(1, { name: 'John' });

```

### Insert

`insert` returns `ResultSetHeader` from [mysql2](https://www.npmjs.com/package/mysql2), which is implemented by `icesql`.

```
import { insert } from 'icesql';

...

async function insertPerson(person: Person) {
  const result = await insert(
    { object: person, table: 'people' },
    connector
  );
  return result;
}

async function insertPeople(people: Person[]) {
  const result = await insert(
    { object: people, table: 'people' },
    connector
  );
  return result;
}

```

### Delete

_note: should be named 'delete', but that is a reserved word in javascript._
`remove` returns `ResultSetHeader` from [mysql2](https://www.npmjs.com/package/mysql2), which is implemented by `icesql`.

```
import { remove } from 'icesql';

...

async function deletePerson(id: number) {
  const result = await remove({ query: { id }, table: 'people' }, connector)
  return result;
}

```

### Execute

All executions return `ResultSetHeader` from [mysql2](https://www.npmjs.com/package/mysql2), which is implemented by `icesql`.

```
import { execute } from 'icesql';

...

const result = await execute({ sql: `MODIFY TABLE person DROP COLUMN name;` }, connector)

```

### Transaction

```
import { transaction } from 'icesql';

...

async function doLotsOfStuff(): Promise<Person[]> {
  return transaction((connection) => {
    await connection.remove({ query: { id }, table: 'people' });

    const people = await connection.query<Person>(`SELECT * FROM people`);
    return people;
  }, connector)
}

```

You can concatenate the connection of `transaction` with regular queries and executions by passing it as the second parameter:

```
// this version is equivalent to the above one
async function doLotsOfStuff(): Promise<Person[]> {
  return transaction((connection) => {
    await remove({ query: { id }, table: 'people' }, connection)

    const people = await query<Person>({ query: {}, table: 'people' }, connection);
    return people;
  }, connector)
}

...

// you can also chain a transaction by passing the connection to a separate function.

async function deletePerson(id: number, connection?: Connection) {
  const result = await remove({ query: { id }, table: 'people' }, connection)
  return result;
}

```
