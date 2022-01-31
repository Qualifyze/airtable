import Airtable from "airtable";
import { AirtableError } from "./error";
import {
  Endpoint,
  EndpointOptions,
  RestMethod,
  UnknownActionPayload,
} from "./endpoint";

type AirtableBase = ReturnType<typeof Airtable.base>;

export class OfficialClientWrapper implements Endpoint {
  public officialClient: AirtableBase;

  constructor(airtable: AirtableBase) {
    this.officialClient = airtable;
  }

  async runAction<P extends UnknownActionPayload>(
    method: RestMethod,
    { path, payload }: EndpointOptions<P>
  ): Promise<unknown> {
    try {
      const { statusCode, headers, body } =
        await this.officialClient.makeRequest({
          method,
          path: path === null ? undefined : `/${path}`,
          qs: payload?.query,
          body: payload?.body,
        });

      if (!(+statusCode >= 200 && +statusCode < 300)) {
        throw new Error(
          `Airtable API responded with status code "${statusCode}, but no semantic error in response: ${JSON.stringify(
            { headers, body },
            null,
            2
          )}`
        );
      }

      return body;
    } catch (err: unknown) {
      // Because official client error is not extended from Error so no stack trace
      if (err instanceof Airtable.Error) {
        throw AirtableError.fromOfficialClientError(err);
      }
      throw err;
    }
  }
}
