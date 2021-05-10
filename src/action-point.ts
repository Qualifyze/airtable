import { EndpointOptions, RestMethod, UnknownActionPayload } from "./endpoint";
import { ValidationContext } from "./validator";

export type ActionPointOptions<P extends UnknownActionPayload, R> =
  EndpointOptions<P> & {
    responseValidation: ValidationContext<unknown, R>;
  };

export interface ActionPoint {
  runAction<P extends UnknownActionPayload, R>(
    method: RestMethod,
    options: ActionPointOptions<P, R>
  ): Promise<R>;
}
