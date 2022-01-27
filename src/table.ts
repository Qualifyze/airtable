import { FieldsValidator, UnknownFields } from "./fields";
import { ActionPoint, ActionPointOptions } from "./action-point";
import { ValidationContext } from "./validator";
import { RestMethod, UnknownActionPayload } from "./endpoint";
import { AirtableError } from "./error";
import { AirtableRecord } from "./record";
import { AirtableRecordDraft } from "./record-draft";
import { SelectQuery, SelectQueryParams } from "./select-query";

import { RecordData, RecordDataValidation } from "./raw-types";
import { MultiRecordDataValidation } from "./raw-types";
import { DeletedRecord, DeletedRecordValidation } from "./raw-types";
import { MultiRecordResponseValidation } from "./raw-types";

export type TableDataSource = ActionPoint;

export interface TableActionPoint {
  runTableAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    { path, ...options }: ActionPointOptions<P, R>
  ): Promise<R>;
}

export class Table<Fields extends UnknownFields>
  implements TableActionPoint, FieldsValidator<Fields>
{
  public readonly base: TableDataSource;
  public readonly name: string;
  public validator?: FieldsValidator<Fields>;

  constructor(
    base: TableDataSource,
    tableName: string,
    validator?: FieldsValidator<Fields>
  ) {
    this.base = base;
    this.name = tableName;
    this.validator = validator;
  }

  createValidation(): ValidationContext<unknown, Fields> {
    return this.validator
      ? this.validator.createValidation()
      : {
          isValid(input: unknown): input is Fields {
            // If a validator is attached, we check the data, otherwise we assume data is valid as we have no means of
            // validating the data otherwise.
            return true;
          },
          getValidationError(): Error {
            return new Error(
              "Cannot create Error from latest validation, because no real validation has taken place"
            );
          },
        };
  }

  private subPath(path?: string | null): string {
    const tablePath = encodeURIComponent(this.name);

    return path ? `${tablePath}/${path}` : tablePath;
  }

  runTableAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    { path, ...options }: ActionPointOptions<P, R>
  ): Promise<R> {
    return this.base.runAction(method, {
      path: this.subPath(path),
      ...options,
    });
  }

  find(recordId: string): Promise<AirtableRecord<Fields>> {
    return new AirtableRecordDraft(this, recordId).fetch();
  }

  async findOrNull(recordId: string): Promise<AirtableRecord<Fields> | null> {
    try {
      // async/await are needed here to catch the error
      return await new AirtableRecordDraft(this, recordId).fetch();
    } catch (err: unknown) {
      if (err instanceof AirtableError && err.error === "NOT_FOUND") {
        return null;
      }
      throw err;
    }
  }

  select(query: SelectQueryParams<Fields> = {}): SelectQuery<Fields> {
    return new SelectQuery<Fields>(this, query);
  }

  private async createSingleRecord(
    fields: Fields
  ): Promise<AirtableRecord<Fields>> {
    const data = await this.runTableAction("POST", {
      responseValidation: new RecordDataValidation(this),
      payload: {
        body: { fields },
      },
    });

    return AirtableRecord.fromRecordData(this, data);
  }

  private async createMultipleRecords(
    records: Fields[]
  ): Promise<AirtableRecord<Fields>[]> {
    const data = await this.runTableAction("POST", {
      responseValidation: new MultiRecordDataValidation(this),
      payload: {
        body: {
          records: records.map((record) => ({ fields: record })),
        },
      },
    });

    return AirtableRecord.fromMultiRecordData(this, data);
  }

  create(data: Fields): Promise<AirtableRecord<Fields>>;
  create(data: Fields[]): Promise<AirtableRecord<Fields>[]>;
  create(
    data: Fields | Fields[]
  ): Promise<AirtableRecord<Fields> | AirtableRecord<Fields>[]> {
    return Array.isArray(data)
      ? this.createMultipleRecords(data)
      : this.createSingleRecord(data);
  }

  private async updateSingleRecord(
    data: RecordData<Partial<Fields>>
  ): Promise<AirtableRecord<Fields>> {
    return new AirtableRecordDraft(this, data.id).update(data.fields);
  }

  private async updateMultipleRecords(
    data: RecordData<Partial<Fields>>[]
  ): Promise<AirtableRecord<Fields>[]> {
    const response = await this.runTableAction("PATCH", {
      responseValidation: new MultiRecordDataValidation(this),
      payload: {
        body: { records: data },
      },
    });

    return AirtableRecord.fromMultiRecordData(this, response);
  }

  private async replaceSingleRecord(
    data: RecordData<Fields>
  ): Promise<AirtableRecord<Fields>> {
    return new AirtableRecordDraft(this, data.id).replace(data.fields);
  }

  private async replaceMultipleRecords(
    data: RecordData<Fields>[]
  ): Promise<AirtableRecord<Fields>[]> {
    const response = await this.runTableAction("PUT", {
      responseValidation: new MultiRecordDataValidation(this),
      payload: {
        body: { records: data },
      },
    });
    return AirtableRecord.fromMultiRecordData(this, response);
  }

  update(data: RecordData<Partial<Fields>>): Promise<AirtableRecord<Fields>>;
  update(
    data: RecordData<Partial<Fields>>[]
  ): Promise<AirtableRecord<Fields>[]>;
  async update(
    data: RecordData<Partial<Fields>> | RecordData<Partial<Fields>>[]
  ): Promise<AirtableRecord<Fields> | AirtableRecord<Fields>[]> {
    return Array.isArray(data)
      ? this.updateMultipleRecords(data)
      : this.updateSingleRecord(data);
  }

  replace(data: RecordData<Fields>): Promise<AirtableRecord<Fields>>;
  replace(data: RecordData<Fields>[]): Promise<AirtableRecord<Fields>[]>;
  async replace(
    data: RecordData<Fields> | RecordData<Fields>[]
  ): Promise<AirtableRecord<Fields> | AirtableRecord<Fields>[]> {
    return Array.isArray(data)
      ? this.replaceMultipleRecords(data)
      : this.replaceSingleRecord(data);
  }

  private destroySingleRecord(id: string): Promise<DeletedRecord> {
    return new AirtableRecordDraft(this, id).destroy();
  }

  private async destroyMultipleRecords(
    ids: string[]
  ): Promise<DeletedRecord[]> {
    const { records } = await this.runTableAction("DELETE", {
      payload: {
        query: { records: ids },
      },
      responseValidation: new MultiRecordResponseValidation({
        createValidation: () => new DeletedRecordValidation(),
      }),
    });

    return records;
  }

  destroy(id: string): Promise<DeletedRecord>;
  destroy(ids: string[]): Promise<DeletedRecord[]>;
  destroy(ids: string | string[]): Promise<DeletedRecord | DeletedRecord[]> {
    return Array.isArray(ids)
      ? this.destroyMultipleRecords(ids)
      : this.destroySingleRecord(ids);
  }
}
