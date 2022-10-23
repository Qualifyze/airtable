import { ActionPoint, ActionPointOptions } from "./action-point";
import { Endpoint, RestMethod, UnknownActionPayload } from "./endpoint";
import type AirtableOfficial from "airtable";
import { OfficialClientWrapper } from "./official-client-wrapper";
import { UnknownFields } from "./fields";
import { Table } from "./table";
import { Validator } from "./validator";
import { AirtableEndpoint, AirtableEndpointOptions } from "./gop-client";

export class Base implements ActionPoint {
  public readonly endpoint: Endpoint;

  static fromOfficialClient(airtable: AirtableOfficial, baseId: string): Base {
    return new this(new OfficialClientWrapper(airtable.base(baseId)));
  }
  static client(options: AirtableEndpointOptions): Base {
    return new Base(new AirtableEndpoint(options));
  }

  constructor(endpoint: Endpoint) {
    this.endpoint = endpoint;
  }

  async runAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    { responseValidation, ...options }: ActionPointOptions<P, R>
  ): Promise<R> {
    const result = await this.endpoint.runAction(method, options);
    if (!responseValidation.isValid(result)) {
      throw (
        responseValidation.getValidationError() ||
        new Error("Encountered unknown error while validating the response")
      );
    }
    return result;
  }

  table<Fields extends UnknownFields = UnknownFields>(
    tableName: string,
    validator?: Validator<Fields>
  ): Table<Fields> {
    return new Table<Fields>(this, tableName, validator);
  }
}
