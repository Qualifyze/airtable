# @qualifyze/airtable

## _What_ is @qualifyze/airtable?

A more powerful JS/TS client for the [Airtable API](https://airtable.com/api) that can be used with Airtable's API
directly or through proxy-endpoints that provide a different Auth mechanism.

## _Why_ is @qualifyze/airtable useful?

In comparison to the [official client](https://github.com/airtable/airtable.js), `@qualifyze/airtable` brings these advantages:

- You can use this client to connect multiple API endpoints.
- You can use this client to connect to Airtable API endpoints with an alternative auth-mechanism.
- Allows type-annotations and run-time validations for table-fields.
- Pagination when listing records is much easier through Async Iterators.
- Allows the use of Array Notation when filtering queries through [@qualifyze/airtable-formulator](https://github.com/Qualifyze/airtable-formulator).

## _How_ to use it?

The API of this client for the most part is identical to the official clients API.

### Connect to the _official_ API using the official client

```javascript
import Airtable from "airtable";
import { Base } from "@qualifyze/airtable";

Airtable.configure({ apiKey: "YOUR_SECRET_API_KEY" });
const officialClient = new Airtable();

const base = Base.fromOfficialClient(officialClient, myBaseId);
```

### Use Type Annotation for table fields

```typescript
type Person = {
  name?: string;
  age?: number;
};

const persons = base.table<Person>("persons");

const record = persons.create({
  name: "Eve",
  age: "not a number", // Type Error
});
```

### Add run-time validators

With the `Validator` interface you can wrap any validation library to validate your data at runtime.

```typescript
import { Validator } from "./validator";

const validator: Validator<Person> = {
  createValidator() {
    return {
      isValid(data: unknown): data is Person {
        // Return true if data is a person.
      },
      getValidationError(): Error | null {
        // Return validation errors that were encountered in the last call to isValid().
      },
    };
  },
};

const persons = base.table("persons", validator);
```

### Iterating over list results

```javascript
const query = {
  filterByFormula: [">", { field: "age" }, 35],
};

for await (const person of persons.select(query)) {
  console.log(person.data);
}
```

As with any Async iterators it has to be warned that an iterator can only be used once at a time:

```javascript

async function runIteration(query) {
    for await(const record of query) {
        // Do something.
    }
}

// BAD: Use same same query in parallel iterators.
const query = table.query({});
Promise.all(runIteration(query), runIteration(query)); // <- BAD

// GOOD: For parallel iterations use separate query obejcts.
const queryA = table.query({});
const queryB = table.query({});
Promise.all(runIteration(queryA), runIteration(queryB)); // <- GOOD
```

### Use an alternative Authentication Method, rather than the official client

```typescript
import { Base, Endpoint, ActionPayload, RestMethod } from "@qualifyze/airtable";

const myClient: Endpoint = {
  async runAction(
    method: RestMethod,
    { path, payload: { query, body } }: ActionPayload
  ): Promise<unknown> {
    // Implement your own Endpoint interface that
    // Throw any API-level errors.
    // Return the response payload as is.
  },
};

const base = new Base(myClient);
```

### Key API **incompatibilities** to the official client

#### No Callback APIs

It's 2021. Why would you need callback APIs?

Use Promises or async/await.

#### Record objects are Immutable:

So it won't drive you insane.

```javascript
const record = persons.find("my-id");
const updatedRecord = await record.update({ age: record.data.age + 1 });

console.log({
  before: record.data.age,
  after: updatedRecord.data.age
});
```

There are no `.set()` or `.get()` methods on the Record API.

## Testing changes

In addition to usual `lint` and `test` scripts, there is an integration test to check
the client against the real airtable base.

- create the file `.env` based on `.env.example`
- pick a table with at least two string fields where it's ok to create new records
- bash `npm run integration`

All the created records are deleted in case of the successful execution.

## Contributing code

Add the changeset description using the interactive command `npx changeset`.
This will create a new file in `.changeset` folder which defines how the change
should affect the package version (major, minor, patch) and contains a small
description for the release notes. The file should be part of the same pull requests
it describes.

## Release a new version

Each PR with changeset files merged into the main branch will open/update PR
to release the package with the proper version. Merging that PR will bump the version,
create a GitHub release and publish the new version to the npm registry.
