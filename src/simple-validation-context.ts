import { ValidationContext } from "./validator";

export abstract class SimpleValidationContext<I, O extends I>
  implements ValidationContext<I, O>
{
  private listOfErrors: Error[] = [];
  protected readonly dataDescription: string;

  constructor(dataDescription: string) {
    this.dataDescription = dataDescription;
  }

  protected addError(error: Error): this {
    this.listOfErrors.push(error);
    return this;
  }

  protected addValidation<I, O extends I>(
    validator: ValidationContext<I, O>,
    data: I
  ): data is O {
    const isValid = validator.isValid(data);

    if (!isValid) {
      this.addError(
        validator.getValidationError() || new Error("Unknown validation error")
      );
    }

    return isValid;
  }

  createErrorString(indent = "\t"): string {
    return this.listOfErrors
      .map((error, index, array) => {
        const prefix = array.length > 1 ? `#${index + 1} ` : "";
        const message = (error.message || error).toString();
        return `${indent}${prefix}${message}`.split("\n").join(`\n${indent}`);
      })
      .join("\n");
  }

  getValidationError(): Error | null {
    const numberOfErrors = this.listOfErrors.length;

    if (numberOfErrors === 0) {
      return null;
    }

    const friendlyNumberOfErrors =
      numberOfErrors > 1 ? `${numberOfErrors} errors` : "an error";

    return new Error(
      `Encountered ${friendlyNumberOfErrors} while validating "${
        this.dataDescription
      }":\n${this.createErrorString()}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected isObject(input: unknown): input is object {
    if (typeof input !== "object") {
      this.addError(
        new Error(
          `Encountered unexpected ${typeof input} where an object was expected`
        )
      );
      return false;
    }

    if (input === null) {
      this.addError(
        new Error("Encountered unexpected null where an object was expected")
      );
      return false;
    }

    return true;
  }

  abstract isValid(input: I): input is O;
}
