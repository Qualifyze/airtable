import { SimpleValidationContext } from "../simple-validation-context";

export type DeletedRecord = { id: string; deleted: true };

export class DeletedRecordValidation extends SimpleValidationContext<
  unknown,
  DeletedRecord
> {
  constructor() {
    super("Deleted Airtable Record");
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  static hasId(subject: object): subject is { id: unknown } {
    return (subject as { id: unknown }).id !== undefined;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  static hasDeleted(subject: object): subject is { deleted: unknown } {
    return (subject as { deleted: unknown }).deleted !== undefined;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private isDeletedRecord(result: object): result is DeletedRecord {
    if (
      !DeletedRecordValidation.hasId(result) ||
      typeof result.id !== "string"
    ) {
      this.addError(
        new Error("Expected object to have a string property 'id'")
      );
      return false;
    }

    if (
      !DeletedRecordValidation.hasDeleted(result) ||
      result.deleted !== true
    ) {
      this.addError(
        new Error("Expected object to have property 'deleted' set to true")
      );
      return false;
    }

    return true;
  }

  isValid(input: unknown): input is DeletedRecord {
    return this.isObject(input) && this.isDeletedRecord(input);
  }
}
