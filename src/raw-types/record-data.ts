import { FieldsValidator, UnknownFields } from "../fields";
import { SimpleValidationContext } from "../simple-validation-context";

export type RecordData<Fields extends UnknownFields> = {
  id: string;
  fields: Fields;
};

export class RecordDataValidation<
  Fields extends UnknownFields
> extends SimpleValidationContext<unknown, RecordData<Fields>> {
  private fieldsValidator: FieldsValidator<Fields>;

  constructor(fieldsValidator: FieldsValidator<Fields>) {
    super("Airtable Record Data");
    this.fieldsValidator = fieldsValidator;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private hasIdString(input: object): input is { id: string } {
    const obj = input as { id: unknown };
    return typeof obj.id === "string";
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  hasFields(input: object): input is { fields: unknown } {
    const obj = input as { fields: unknown };
    return obj.fields !== undefined;
  }

  isValid(input: unknown): input is RecordData<Fields> {
    if (!this.isObject(input)) {
      return false;
    }

    if (!this.hasIdString(input)) {
      this.addError(new Error("Expected record data to have a string id"));
      return false;
    }

    if (!this.hasFields(input)) {
      this.addError(
        new Error(`Expected record ${input.id} to have a fields property`)
      );
      return false;
    }

    return this.addValidation(
      this.fieldsValidator.createValidation(input.id),
      input.fields
    );
  }
}
