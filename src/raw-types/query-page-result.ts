import { FieldsValidator, UnknownFields } from "../fields";
import { SimpleValidationContext } from "../simple-validation-context";
import { MultiRecordDataValidation } from "./multi-record-data";
import { RecordData } from "./record-data";

export type QueryPageResult<Fields extends UnknownFields> = {
  offset?: string;
  records?: RecordData<Fields>[];
};

export class QueryPageResultValidation<
  Fields extends UnknownFields
> extends SimpleValidationContext<unknown, QueryPageResult<Fields>> {
  private readonly fieldsValidator: FieldsValidator<Fields>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  static hasOffset(input: object): input is { offset: unknown } {
    const obj = input as { offset: unknown };
    return obj.offset !== undefined;
  }

  constructor(fieldsValidator: FieldsValidator<Fields>) {
    super("Airtable Page Results");
    this.fieldsValidator = fieldsValidator;
  }

  isValid(input: unknown): input is QueryPageResult<Fields> {
    if (!this.isObject(input)) {
      return false;
    }

    if (
      MultiRecordDataValidation.hasRecords(input) &&
      !this.addValidation(
        new MultiRecordDataValidation(this.fieldsValidator),
        input
      )
    ) {
      return false;
    }

    if (
      QueryPageResultValidation.hasOffset(input) &&
      typeof input.offset !== "string"
    ) {
      this.addError(new Error("Expected offset to be a string"));
      return false;
    }

    return true;
  }
}
