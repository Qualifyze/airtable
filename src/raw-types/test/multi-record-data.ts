import { describe, it } from "@jest/globals";
import { MultiRecordDataValidation } from "../multi-record-data";
import { createMock } from "ts-auto-mock";
import { FieldsValidator, UnknownFields } from "../../fields";
import { expect } from "../../test-utils/expect";
import { ValidationContext } from "../../validator";

function mockFieldsValidator<Fields extends UnknownFields>(
  isValid: boolean
): FieldsValidator<Fields> {
  const validation = createMock<ValidationContext<unknown, Fields>>({
    isValid(input: unknown): input is Fields {
      return isValid;
    },
  });

  return createMock<FieldsValidator<Fields>>({
    createValidation(): ValidationContext<unknown, Fields> {
      return validation;
    },
  });
}

describe(`class ${MultiRecordDataValidation.name}`, () => {
  describe(`${MultiRecordDataValidation.name}::${MultiRecordDataValidation.prototype.isValid.name}()`, () => {
    it("should accept valid MultiRecordData", () => {
      {
        const fieldsValidator = createMock<FieldsValidator<UnknownFields>>();
        const validation = new MultiRecordDataValidation(fieldsValidator);
        expect(validation).toAccept({ records: [] });
        expect(
          fieldsValidator.createValidation().isValid
        ).not.toHaveBeenCalled();
      }

      {
        const fieldsValidator = mockFieldsValidator<Record<never, never>>(true);
        const validation = new MultiRecordDataValidation(fieldsValidator);
        expect(validation).toAccept({
          records: [{ id: "my-id", fields: {} }],
        });
      }

      {
        const fieldsValidator = mockFieldsValidator<Record<never, never>>(true);
        const validation = new MultiRecordDataValidation(fieldsValidator);
        expect(validation).toAccept({
          records: [
            { id: "one", fields: {} },
            { id: "two", fields: {} },
          ],
        });
      }
    });
  });
});
