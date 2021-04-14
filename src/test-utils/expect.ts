import _expect, { MatcherState } from "expect";
import { ValidationContext, Validator } from "../validator";

type MatcherResult = {
  pass: boolean;
  message(): string;
};

interface xMatchers {
  toBeValidWith<T>(received: T, validator: Validator<T>): MatcherResult;
  toAccept<T>(
    validation: ValidationContext<unknown, T>,
    expected: T
  ): MatcherResult;
}

const extensions: xMatchers & ThisType<MatcherState> = {
  toBeValidWith<T>(received: T, validator: Validator<T>) {
    const validation = validator.createValidation();
    const isValid = validation.isValid(received);
    const error = validation.getValidationError();

    return {
      pass: isValid,
      message: () => {
        const hint = this.utils.matcherHint(
          "toBeValidWith",
          "Value",
          "Validator",
          {
            comment: "Expect Value to be valid with Validator",
            isNot: this.isNot,
            promise: this.promise,
          }
        );

        return (
          `${hint}\n\n` +
          `Value: ${this.utils.printReceived(received)}\n` +
          `Expected: ${this.utils.printExpected(!isValid)}\n` +
          `Actual: ${this.utils.printReceived(isValid)}\n` +
          (error ? `Validation Error: ${this.utils.printReceived(error)}` : "")
        );
      },
    };
  },

  toAccept<T>(validation: ValidationContext<unknown, T>, expected: T) {
    const isValid = validation.isValid(expected);
    const error = validation.getValidationError();

    return {
      pass: isValid,
      message: () => {
        const hint = this.utils.matcherHint(
          "toAccept",
          "ValidationContext",
          "Value",
          {
            comment: "Expect Validation to deem Value as valid",
            isNot: this.isNot,
            promise: this.promise,
          }
        );

        return (
          `${hint}\n\n` +
          `Value: ${this.utils.stringify(expected)}\n` +
          `Expected: ${this.utils.printExpected(!isValid)}\n` +
          `Actual: ${this.utils.printReceived(isValid)}\n` +
          (error ? `Validation Error: ${this.utils.printReceived(error)}` : "")
        );
      },
    };
  },
};

// XXX while jest mutates the library when extending expect, there is no way to update type-declarations accordingly.
// Therefore we create an extended type here that pretends that incorporates the extended interface above.
// This is quite hacky and will probably not work for other contexts where these extensions are expected to be available
// in.

_expect.extend(extensions);

type Expect = typeof _expect;
type R = ReturnType<Expect>;

type OmitFirstArg<F> = F extends (x: infer X, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type WithReturn<F, R> = F extends (...args: infer P) => infer X
  ? (...args: P) => R
  : never;

type MatcherInterface<Matcher, R> = WithReturn<OmitFirstArg<Matcher>, R>;

type MatcherInterfaces<R> = {
  [K in keyof xMatchers]: MatcherInterface<xMatchers[K], R>;
};

interface xR extends R, MatcherInterfaces<xR> {
  not: xR;
}

interface xExpect extends Expect {
  <R>(arg: R): xR;
}

export const expect = _expect as xExpect;
