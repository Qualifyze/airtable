import { SimpleValidationContext } from "../simple-validation-context";
import { Validator } from "../validator";

export type MultiRecordResponse<RecordData> = { records: RecordData[] };

export class MultiRecordResponseValidation<
  RecordData
> extends SimpleValidationContext<unknown, MultiRecordResponse<RecordData>> {
  private itemValidator: Validator<RecordData>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  static hasRecords(input: object): input is { records: unknown } {
    const obj = input as { records: unknown };

    return obj.records !== undefined;
  }

  constructor(itemValidator: Validator<RecordData>) {
    super("Airtable multi-record response");
    this.itemValidator = itemValidator;
  }

  isValid(input: unknown): input is MultiRecordResponse<RecordData> {
    if (!this.isObject(input)) {
      return false;
    }

    if (!MultiRecordResponseValidation.hasRecords(input)) {
      this.addError(new Error("Expected object to have property 'records'"));
      return false;
    }

    if (!Array.isArray(input.records)) {
      this.addError(
        new Error("Expected object property 'records' to be an array")
      );
      return false;
    }

    return input.records.every((record) =>
      this.addValidation(this.itemValidator.createValidation(), record)
    );
  }
}
