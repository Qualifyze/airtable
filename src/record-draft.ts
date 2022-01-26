import { FieldsValidator, UnknownFields } from "./fields";
import { ActionPointOptions } from "./action-point";
import { RestMethod, UnknownActionPayload } from "./endpoint";
import {
  RecordDataValidation,
  DeletedRecord,
  DeletedRecordValidation,
} from "./raw-types";
import { TableActionPoint } from "./table";
import { AirtableRecord } from "./record";

export type RecordDataSource<Fields extends UnknownFields> = TableActionPoint &
  FieldsValidator<Fields>;

export interface RecordActionPoint {
  runRecordAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    { path, ...options }: ActionPointOptions<P, R>
  ): Promise<R>;
}

export class AirtableRecordDraft<Fields extends UnknownFields>
  implements RecordActionPoint
{
  public readonly source: RecordDataSource<Fields>;
  public readonly id: string;

  constructor(source: RecordDataSource<Fields>, id: string) {
    this.source = source;
    this.id = id;
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
    const { fields } = await this.runRecordAction("GET", {
      responseValidation: new RecordDataValidation(this.source),
    });
    return new AirtableRecord(this.source, this.id, fields);
  }

  async update(data: Partial<Fields>): Promise<AirtableRecord<Fields>> {
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
