import { describe, expect, it, jest } from "@jest/globals";
import {
  SelectQuery,
  SelectQueryDataSource,
  SelectQueryPayload,
} from "../select-query";
import { createMock } from "ts-auto-mock";
import { QueryPageResult, RecordData } from "../raw-types";
import * as JestMock from "jest-mock";
import { UnknownFields } from "../fields";

function mockSource<R extends UnknownFields>(
  ...pages: QueryPageResult<R>[]
): {
  source: SelectQueryDataSource<R>;
  mockedApi: JestMock.Mock<
    Promise<QueryPageResult<R>>,
    [string, SelectQueryPayload<R>]
  >;
} {
  const mockedApi =
    jest.fn<Promise<QueryPageResult<R>>, [string, SelectQueryPayload<R>]>();

  const source = createMock<SelectQueryDataSource<R>>({
    runTableAction: mockedApi as unknown as <Q>() => Q,
  });

  pages.forEach((page) => mockedApi.mockResolvedValueOnce(page));

  return {
    source,
    mockedApi,
  };
}

describe(`class ${SelectQuery.name}`, () => {
  describe(`${SelectQuery.prototype[Symbol.asyncIterator].name}`, () => {
    it("should have zero iterations on empty results", async () => {
      {
        const { source, mockedApi } = mockSource({});

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
        }
        expect(iteration).not.toHaveBeenCalled();
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }

      {
        const { source, mockedApi } = mockSource({ records: [] });

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
        }
        expect(iteration).not.toHaveBeenCalled();
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }
    });

    it("should iterate over single page results", async () => {
      {
        const { source, mockedApi } = mockSource({
          records: [{ id: "one", fields: {} }],
        });

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
          expect(record.id).toEqual("one");
        }
        expect(iteration).toHaveBeenCalledTimes(1);
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }
      {
        const { source, mockedApi } = mockSource({
          records: [
            { id: "one", fields: {} },
            { id: "two", fields: {} },
          ],
        });

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
        }
        expect(iteration).toHaveBeenCalledTimes(2);
        expect(iteration.mock.calls[0][0]).toMatchObject({ id: "one" });
        expect(iteration.mock.calls[1][0]).toMatchObject({ id: "two" });
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }
    });

    it("should iterate over multi-page results", async () => {
      {
        const { source, mockedApi } = mockSource(
          {
            records: [{ id: "one", fields: {} }],
            offset: "next",
          },
          {
            records: [{ id: "two", fields: {} }],
          }
        );

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
        }

        expect(iteration).toHaveBeenCalledTimes(2);
        expect(iteration.mock.calls[0][0]).toMatchObject({ id: "one" });
        expect(iteration.mock.calls[1][0]).toMatchObject({ id: "two" });
        expect(mockedApi).toHaveBeenCalledTimes(2);
        expect(mockedApi).toHaveBeenLastCalledWith(
          "GET",
          expect.objectContaining({
            payload: { query: { offset: "next" } },
          })
        );
      }
      {
        const { source, mockedApi } = mockSource(
          {
            records: [{ id: "one", fields: {} }],
            offset: "next-1",
          },
          {
            records: [{ id: "two", fields: {} }],
            offset: "next-2",
          },
          {}
        );

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
        }
        expect(iteration).toHaveBeenCalledTimes(2);
        expect(iteration.mock.calls[0][0]).toMatchObject({ id: "one" });
        expect(iteration.mock.calls[1][0]).toMatchObject({ id: "two" });
        expect(mockedApi).toHaveBeenCalledTimes(3);
        expect(mockedApi).toHaveBeenLastCalledWith(
          "GET",
          expect.objectContaining({
            payload: { query: { offset: "next-2" } },
          })
        );
      }
      {
        const { source, mockedApi } = mockSource(
          {
            records: [
              { id: "one", fields: {} },
              { id: "two", fields: {} },
            ],
            offset: "next",
          },
          {
            records: [{ id: "three", fields: {} }],
          }
        );

        const query = new SelectQuery(source, {});

        const iteration = jest.fn();

        for await (const record of query) {
          iteration(record);
        }

        expect(iteration).toHaveBeenCalledTimes(3);
        expect(iteration.mock.calls[0][0]).toMatchObject({ id: "one" });
        expect(iteration.mock.calls[1][0]).toMatchObject({ id: "two" });
        expect(iteration.mock.calls[2][0]).toMatchObject({ id: "three" });
        expect(mockedApi).toHaveBeenCalledTimes(2);
      }
    });

    it("should allow multiple iteration cycles", async () => {
      const { source } = mockSource(
        {
          records: [{ id: "one", fields: {} }],
          offset: "next",
        },
        {
          records: [{ id: "two", fields: {} }],
        },
        // We are planning to iterate through the pages twice.
        {
          records: [{ id: "one", fields: {} }],
          offset: "next",
        },
        {
          records: [{ id: "two", fields: {} }],
        }
      );

      const query = new SelectQuery(source, {});

      const iteration = jest.fn();

      for await (const record of query) {
        iteration(record);
      }
      expect(iteration).toHaveBeenCalledTimes(2);

      for await (const record of query) {
        iteration(record);
      }

      expect(iteration).toHaveBeenCalledTimes(4);
    });
  });
  describe(`${SelectQuery.prototype.all.name}`, () => {
    it("Should work with empty an empty response", async () => {
      {
        const { source, mockedApi } = mockSource({});
        const query = new SelectQuery(source, {});
        expect(await query.all()).toEqual([]);
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }

      {
        const { source, mockedApi } = mockSource({ records: [] });
        const query = new SelectQuery(source, {});
        expect(await query.all()).toEqual([]);
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }
    });

    it("Should work with a single page response", async () => {
      {
        const { source, mockedApi } = mockSource({
          records: [
            createMock<RecordData<Record<never, never>>>({
              id: "test",
              fields: {},
            }),
          ],
        });
        const query = new SelectQuery(source, {});
        expect(await query.all()).toMatchObject([{ id: "test", data: {} }]);
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }

      {
        const { source, mockedApi } = mockSource({
          records: [
            createMock<RecordData<Record<never, never>>>({
              id: "one",
              fields: {},
            }),
            createMock<RecordData<Record<never, never>>>({
              id: "two",
              fields: {},
            }),
          ],
        });
        const query = new SelectQuery(source, {});

        expect(await query.all()).toMatchObject([
          { id: "one", data: {} },
          { id: "two", data: {} },
        ]);
        expect(mockedApi).toHaveBeenCalledTimes(1);
      }
    });

    it("Should work with a multi-page response", async () => {
      const { source, mockedApi } = mockSource(
        {
          records: [
            createMock<RecordData<Record<never, never>>>({
              id: "one",
              fields: {},
            }),
          ],
          offset: "page-2",
        },
        {
          records: [
            createMock<RecordData<Record<never, never>>>({
              id: "two",
              fields: {},
            }),
          ],
        }
      );

      const query = new SelectQuery(source, {});

      expect(await query.all()).toMatchObject([
        { id: "one", data: {} },
        { id: "two", data: {} },
      ]);
      expect(mockedApi).toHaveBeenCalledTimes(2);
      expect(mockedApi).toHaveBeenLastCalledWith(
        "GET",
        expect.objectContaining({
          payload: { query: { offset: "page-2" } },
        })
      );
      mockedApi.mockReset();
    });
  });
});
