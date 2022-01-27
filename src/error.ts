import type { Error as OfficialClientError } from "airtable";

// Use a custom error to bring the proper stack trace
export class AirtableError extends Error {
  constructor(
    public error: string,
    message: string,
    public statusCode: number
  ) {
    super(message);

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, AirtableError.prototype);
    }
  }

  static fromOfficialClientError({
    error,
    message,
    statusCode,
  }: OfficialClientError) {
    return new AirtableError(error, message, statusCode);
  }
}
