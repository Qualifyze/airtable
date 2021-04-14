import { Validator } from "./validator";

export type UnknownFields = Record<Exclude<string, "id">, unknown>;
export type FieldName<Fields> = keyof Fields;

export type FieldsValidator<Fields extends UnknownFields> = Validator<Fields>;
