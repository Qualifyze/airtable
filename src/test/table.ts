import { describe, expect, it } from "@jest/globals";

import { Table } from "../table";
import {
  Endpoint,
  EndpointOptions,
  RestMethod,
  UnknownActionPayload,
} from "../endpoint";
import { FieldsValidator } from "../fields";
import { Base } from "../base";

type SomeData = {
  name: string;
  age: number;
};

describe("Table validation", () => {
  const valid = { name: "John Doe", age: 30 };
  const invalid = { name: 30, age: "John Doe" };

  const endpoint: Endpoint = {
    async runAction<P extends UnknownActionPayload, R>(
      method: RestMethod,
      { path }: EndpointOptions<P>
    ): Promise<R> {
      if (method !== "GET") throw new Error("Mock supports only GET");

      switch (path) {
        case "valid-table":
          return {
            records: [
              { id: "first-valid-id", fields: valid },
              { id: "second-valid-id", fields: valid },
            ],
          } as unknown as R;

        case "invalid-table":
          return {
            records: [
              { id: "first-valid-id", fields: valid },
              { id: "second-invalid-id", fields: invalid },
              { id: "third-valid-id", fields: valid },
              { id: "fourth-invalid-id", fields: invalid },
            ],
          } as unknown as R;

        case "some-table/valid-id":
          return {
            id: "valid-id",
            fields: valid,
          } as unknown as R;

        case "some-table/invalid-id":
          return {
            id: "invalid-id",
            fields: invalid,
          } as unknown as R;

        default:
          throw new Error(`Example for ${path} is not defined`);
      }
    },
  };

  const validator: FieldsValidator<SomeData> = {
    createValidation(reference?: string) {
      return {
        isValid(input: Record<string, unknown>): input is SomeData {
          if (!input || typeof input !== "object") return false;
          if (!input.name || !input.age) return false;

          return (
            typeof input.name === "string" && typeof input.age === "number"
          );
        },

        getValidationError(): Error {
          return new Error(
            reference === "fourth-invalid-id"
              ? "Special error message\nin two lines"
              : `Invalid record ${reference}`
          );
        },
      };
    },
  };

  it("succeeds when single record is valid", async () => {
    const base = new Base(endpoint);
    const table = new Table<SomeData>(base, "some-table", validator);
    const { id, data } = await table.find("valid-id");
    expect(id).toBe("valid-id");
    expect(data).toEqual(valid);
  });

  it("fails when single record is invalid", async () => {
    const base = new Base(endpoint);
    const table = new Table<SomeData>(base, "some-table", validator);

    await expect(table.find("invalid-id")).rejects
      .toThrowErrorMatchingInlineSnapshot(`
            "Encountered an error while validating \\"Airtable Record Data\\":
            	Invalid record invalid-id"
          `);
  });

  it("succeeds when single record is invalid but there is no validator", async () => {
    const base = new Base(endpoint);
    const table = new Table<SomeData>(base, "some-table");
    const { id, data } = await table.find("invalid-id");
    expect(id).toBe("invalid-id");
    expect(data).toEqual(invalid);
  });

  it("succeeds when all records are valid", async () => {
    const base = new Base(endpoint);
    const table = new Table<SomeData>(base, "valid-table", validator);
    const records = await table.select({}).getPage();

    expect(records).toEqual([
      expect.objectContaining({ id: "first-valid-id", data: valid }),
      expect.objectContaining({ id: "second-valid-id", data: valid }),
    ]);
  });

  it("fails when some records are invalid", async () => {
    const base = new Base(endpoint);
    const table = new Table<SomeData>(base, "invalid-table", validator);

    await expect(table.select({}).getPage()).rejects
      .toThrowErrorMatchingInlineSnapshot(`
            "Encountered an error while validating \\"Airtable Page Results\\":
            	Encountered 2 errors while validating \\"Airtable multi-record response\\":
            		#1 Encountered an error while validating \\"Airtable Record Data\\":
            			Invalid record second-invalid-id
            		#2 Encountered an error while validating \\"Airtable Record Data\\":
            			Special error message
            			in two lines"
          `);
  });
});
