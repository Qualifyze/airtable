import Airtable from "airtable";
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
    const { statusCode, headers, body } = await this.officialClient.makeRequest(
      {
        method,
        path: path === null ? undefined : path,
        qs: payload?.query,
        body: payload?.body,
      }
    );

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
  }
}
