export interface Validator<T> {
  createValidation(reference?: string): ValidationContext<unknown, T>;
}

export interface ValidationContext<I, O extends I> {
  isValid(input: I): input is O;

  getValidationError(): Error | null;
}
