import { got, Got, RetryOptions } from "got";
import {
  Endpoint,
  EndpointOptions,
  RestMethod,
  UnknownActionPayload,
} from "./endpoint";

export interface AirtableEndpointOptions {
  readonly endpointUrl?: string;
  readonly apiKey?: string;
  readonly apiVersion?: string;
  readonly baseId?: string;
  readonly retry?: Partial<RetryOptions>;
}

export class AirtableEndpoint implements Endpoint, AirtableEndpointOptions {
  static endpointUrl =
    process.env.AIRTABLE_ENDPOINT_URL ?? "https://api.airtable.com";

  readonly endpointUrl: string;
  readonly apiKey: string;
  readonly apiVersion: string;
  readonly baseId: string;
  readonly retry?: Partial<RetryOptions>;

  private readonly got: Got;

  constructor(
    {
      endpointUrl = AirtableEndpoint.endpointUrl,
      apiKey = process.env.AIRTABLE_API_KEY,
      apiVersion = "v0",
      baseId = process.env.AIRTABLE_BASE_ID,
      retry,
    }: AirtableEndpointOptions,
    _got = got
  ) {
    this.endpointUrl = endpointUrl;

    if (!apiKey) {
      throw new Error("Need to specify an API key");
    }
    this.apiKey = apiKey;
    this.apiVersion = apiVersion;

    if (!baseId) {
      throw new Error("Need to specify a base ID");
    }
    this.baseId = baseId;
    this.retry = retry;

    this.got = _got.extend({
      prefixUrl: `${this.endpointUrl}/${this.apiVersion}/${this.baseId}`,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      retry,
    });
  }

  runAction<P extends UnknownActionPayload>(
    method: RestMethod,
    { path, payload }: EndpointOptions<P> = {}
  ): Promise<unknown> {
    return this.got({
      url: path,
      method,
      searchParams:
        payload?.query &&
        Object.fromEntries(
          Object.entries(payload.query)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, JSON.stringify(value)])
        ),
      json: payload?.body,
    }).json();
  }
}
