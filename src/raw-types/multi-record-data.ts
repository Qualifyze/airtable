import { FieldsValidator, UnknownFields } from "../fields";
import { RecordData, RecordDataValidation } from "./record-data";
import {
  MultiRecordResponse,
  MultiRecordResponseValidation,
} from "./multi-record-response";

export type MultiRecordData<Fields extends UnknownFields> = MultiRecordResponse<
  RecordData<Fields>
>;

export class MultiRecordDataValidation<
  Fields extends UnknownFields
> extends MultiRecordResponseValidation<RecordData<Fields>> {
  constructor(fieldsValidator: FieldsValidator<Fields>) {
    super({
      createValidation: () => new RecordDataValidation(fieldsValidator),
    });
  }
}
