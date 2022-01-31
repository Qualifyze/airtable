import Airtable from "airtable";
import { AirtableError, AirtableRecord, Base, UnknownFields } from "./src";

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableName = process.env.TEST_TABLE_NAME;

// FIXME Better to use ajv package to read JSON schema file for a table under test
// which would help testing the field validation
const fieldNames = (process.env.TEST_FIELD_NAMES || "").split(",");

if (!apiKey) throw new Error("AIRTABLE_API_KEY is not set");
if (!baseId) throw new Error("AIRTABLE_BASE_ID is not set");
if (!tableName) throw new Error("TEST_TABLE_NAME is not set");

if (!fieldNames.length) {
  throw new Error("TEST_FIELD_NAMES should be a comma separated list");
} else if (fieldNames.length < 2) {
  throw new Error("TEST_FIELD_NAMES should contain at least two elements");
}

const officialClient = new Airtable({ apiKey });
const base = Base.fromOfficialClient(officialClient, baseId);
const table = base.table(tableName);

const fields = fieldNames.reduce((result, field) => {
  result[field] = `some-${field}`;
  return result;
}, {} as UnknownFields);

// take only the first one to check update vs replace
const nextFields = {
  [fieldNames[0]]: `another-${fieldNames[0]}`,
};

const validateFields = (source?: UnknownFields, target?: UnknownFields) => {
  fieldNames.forEach((field) => {
    if (source?.[field] !== target?.[field]) {
      throw new Error(
        `Field ${field} value "${source?.[field]}" <> "${target?.[field]}"`
      );
    }
  });
};

const validateRecord = (
  source: { id: string; data?: UnknownFields },
  target: { id: string; data?: UnknownFields }
) => {
  if (source === target) throw Error("Records reference the same object");
  if (source.id !== target.id) throw Error("IDs don't match");
  validateFields(source.data, target.data);
};

const validateNotFound = async <R>(target: () => Promise<R>) => {
  try {
    await target();
  } catch (err: unknown) {
    if (err instanceof AirtableError && err.error === "NOT_FOUND") return;
    throw err;
  }

  throw new Error("Expected an error here");
};

const main = async () => {
  console.log("Checking table.create a single record...");
  const singleRecord = await table.create(fields);

  try {
    validateFields(singleRecord.data, fields);

    console.log("Checking record.fetch...");

    validateRecord(
      await new AirtableRecord(table, singleRecord.id, {}).fetch(),
      singleRecord
    );

    console.log("Checking record.update...");

    validateRecord(await singleRecord.update(nextFields), {
      id: singleRecord.id,
      data: {
        ...fields,
        ...nextFields,
      },
    });

    console.log("Checking record.replace...");

    validateRecord(await singleRecord.replace(nextFields), {
      id: singleRecord.id,
      data: nextFields,
    });
  } finally {
    console.log("Cleaning up with record.destroy...");
    await singleRecord.destroy();

    console.log("Checking with record.fetch for non-existing record...");

    await validateNotFound(() =>
      new AirtableRecord(table, singleRecord.id, {}).fetch()
    );
  }

  console.log("Checking table.create for multiple records...");
  const multipleRecords = await table.create([fields, nextFields]);

  try {
    validateFields(multipleRecords[0].data, fields);
    validateFields(multipleRecords[1].data, nextFields);

    console.log("Checking table.find...");
    validateRecord(await table.find(multipleRecords[0].id), multipleRecords[0]);

    console.log("Checking table.findOrNull...");

    validateRecord(
      (await table.findOrNull(multipleRecords[0].id)) ?? { id: "wrong" },
      multipleRecords[0]
    );

    console.log("Checking table.update for multiple records...");

    const updatedRecords = await table.update([
      {
        id: multipleRecords[0].id,
        fields: nextFields,
      },
      {
        id: multipleRecords[1].id,
        fields: fields,
      },
    ]);

    validateRecord(updatedRecords[0], {
      id: multipleRecords[0].id,
      data: {
        ...fields,
        ...nextFields,
      },
    });

    validateRecord(updatedRecords[1], {
      id: multipleRecords[1].id,
      data: fields,
    });

    console.log("Checking table.replace for multiple records...");

    const replacedRecords = await table.replace([
      {
        id: multipleRecords[0].id,
        fields: fields,
      },
      {
        id: multipleRecords[1].id,
        fields: nextFields,
      },
    ]);

    validateRecord(replacedRecords[0], {
      id: multipleRecords[0].id,
      data: fields,
    });

    validateRecord(replacedRecords[1], {
      id: multipleRecords[1].id,
      data: nextFields,
    });

    console.log("Checking table.update for a single record...");

    validateRecord(
      await table.update({
        id: multipleRecords[0].id,
        fields: nextFields,
      }),
      {
        id: multipleRecords[0].id,
        data: {
          ...fields,
          ...nextFields,
        },
      }
    );

    console.log("Checking table.replace for a single record...");

    validateRecord(
      await table.replace({
        id: multipleRecords[0].id,
        fields: nextFields,
      }),
      {
        id: multipleRecords[0].id,
        data: nextFields,
      }
    );
  } finally {
    console.log("Cleaning up with table.destroy for multiple records...");
    await table.destroy(multipleRecords.map((record) => record.id));
  }

  console.log("Checking with table.find for non-existing record...");
  await validateNotFound(() => table.find(multipleRecords[0].id));

  console.log("Checking with table.findOne for non-existing record...");

  if ((await table.findOrNull(multipleRecords[0].id)) !== null) {
    throw new Error(`The method findOrNull didn't return null as expected`);
  }

  // TODO Test table.select & validation
  console.log("Done");
};

main().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
