import { FieldsValidator, UnknownFields } from "./fields";
import { ActionPointOptions } from "./action-point";
import { RestMethod, UnknownActionPayload } from "./endpoint";
import {
  RecordData,
  RecordDataValidation,
  DeletedRecord,
  DeletedRecordValidation,
  MultiRecordData,
} from "./raw-types";
import { TableActionPoint } from "./table";

export type RecordDataSource<Fields extends UnknownFields> = TableActionPoint &
  FieldsValidator<Fields>;

export interface RecordActionPoint {
  runRecordAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    { path, ...options }: ActionPointOptions<P, R>
  ): Promise<R>;
}

export class AirtableRecord<Fields extends UnknownFields>
  implements RecordActionPoint {
  public readonly source: RecordDataSource<Fields>;
  public readonly id: string;
  public readonly data?: Readonly<Fields>;

  static fromRecordData<Fields extends UnknownFields>(
    source: RecordDataSource<Fields>,
    { id, fields }: RecordData<Fields>
  ): AirtableRecord<Fields> {
    return new AirtableRecord<Fields>(source, id, fields);
  }

  static fromMultiRecordData<Fields extends UnknownFields>(
    source: RecordDataSource<Fields>,
    { records }: MultiRecordData<Fields>
  ): AirtableRecord<Fields>[] {
    return records.map((data) => this.fromRecordData(source, data));
  }

  constructor(source: RecordDataSource<Fields>, id: string, data?: Fields) {
    this.source = source;
    this.id = id;
    this.data = data;
  }

  runRecordAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    { path, ...options }: ActionPointOptions<P, R>
  ): Promise<R> {
    return this.source.runTableAction(method, {
      path: path ? `${this.id}/${path}` : this.id,
      ...options,
    });
  }

  async fetch(): Promise<AirtableRecord<Fields>> {
    const fields = await this.runRecordAction("GET", {
      responseValidation: this.source.createValidation(),
    });
    return new AirtableRecord(this.source, this.id, fields);
  }

  async update(data: Fields): Promise<AirtableRecord<Fields>> {
    const { id, fields } = await this.runRecordAction("PATCH", {
      responseValidation: new RecordDataValidation(this.source),
      payload: {
        body: {
          fields: data,
        },
      },
    });

    return new AirtableRecord(this.source, id, fields);
  }

  async replace(data: Fields): Promise<AirtableRecord<Fields>> {
    const { id, fields } = await this.runRecordAction("PUT", {
      responseValidation: new RecordDataValidation(this.source),
      payload: {
        body: {
          fields: data,
        },
      },
    });

    return new AirtableRecord(this.source, id, fields);
  }

  destroy(): Promise<DeletedRecord> {
    return this.runRecordAction("DELETE", {
      responseValidation: new DeletedRecordValidation(),
    });
  }
}
