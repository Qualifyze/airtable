type UnknownBody = Record<string, unknown>;
type UnknownQuery = Record<string, unknown>;

export interface ActionPayload<Q extends UnknownQuery, B extends UnknownBody> {
  readonly query?: Q;
  readonly body?: B;
}

export type RestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type UnknownActionPayload = ActionPayload<UnknownQuery, UnknownBody>;
export type EndpointOptions<P extends UnknownActionPayload> = {
  path?: string;
  payload?: P;
};

export interface Endpoint {
  runAction<P extends UnknownActionPayload>(
    method: RestMethod,
    options?: EndpointOptions<P>
  ): Promise<unknown>;
}
