import { describe, it } from "@jest/globals";
import { DeletedRecord, DeletedRecordValidation } from "../deleted-record";
import { expect } from "../../test-utils/expect";

describe(`class ${DeletedRecordValidation.name}`, () => {
  describe(`${DeletedRecordValidation.name}::${DeletedRecordValidation.prototype.isValid.name}()`, () => {
    it("should accept a valid DeletedRecord", () => {
      const validation = new DeletedRecordValidation();

      const deletedRecord: DeletedRecord = {
        id: "my-id",
        deleted: true,
      };

      expect(validation).toAccept(deletedRecord);
    });

    it("should accept extra properties", () => {
      const validation = new DeletedRecordValidation();

      const deletedRecord: DeletedRecord & { x: string } = {
        id: "my-id",
        deleted: true,
        x: "whatever",
      };

      expect(validation).toAccept(deletedRecord);
    });

    it("should reject anything that is not a DeletedRecord", () => {
      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept(false);
        expect(validation.getValidationError()?.toString()).toMatch(
          "Encountered unexpected boolean where an object was expected"
        );
      }

      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept(null);
        expect(validation.getValidationError()?.toString()).toMatch(
          "Encountered unexpected null where an object was expected"
        );
      }

      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept([]);
        expect(validation.getValidationError()?.toString()).toMatch(
          "Expected object to have a string property 'id'"
        );
      }

      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept({});
        expect(validation.getValidationError()?.toString()).toMatch(
          "Expected object to have a string property 'id'"
        );
      }

      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept({ id: "my-id" });
        expect(validation.getValidationError()?.toString()).toMatch(
          "Expected object to have property 'deleted' set to true"
        );
      }

      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept({ id: "my-id", deleted: {} });
        expect(validation.getValidationError()?.toString()).toMatch(
          "Expected object to have property 'deleted' set to true"
        );
      }

      {
        const validation = new DeletedRecordValidation();
        expect(validation).not.toAccept({ deleted: true });
        expect(validation.getValidationError()?.toString()).toMatch(
          "Expected object to have a string property 'id'"
        );
      }
    });
  });
});
