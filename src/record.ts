import { UnknownFields } from "./fields";
import { RecordData, MultiRecordData } from "./raw-types";
import { AirtableRecordDraft, RecordDataSource } from "./record-draft";

export class AirtableRecord<
  Fields extends UnknownFields
> extends AirtableRecordDraft<Fields> {
  public readonly data: Readonly<Fields>;

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

  constructor(source: RecordDataSource<Fields>, id: string, data: Fields) {
    super(source, id);
    this.data = data;
  }
}
