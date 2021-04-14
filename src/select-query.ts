import { FieldName, FieldsValidator, UnknownFields } from "./fields";
import { AirtableRecord } from "./record";
import { QueryPageResultValidation } from "./raw-types";
import { compile, Formula } from "@qualifyze/airtable-formulator";
import { ActionPayload } from "./endpoint";
import { ActionPoint } from "./action-point";

type CellFormat = "json" | "string";
type TimeZone = string; // TODO get real list of accepted values.
type UserLocale = string; // TODO get real list of accepted user-locales.
type SortParam<Fields extends UnknownFields> = {
  field: keyof Fields;
  direction: "asc" | "desc";
};

// XXX This is a stub for now, but eventually we may import this from AirtableOfficial, as they seem to be working on
// a new version that might export it.
export type SelectQueryPayload<Fields extends UnknownFields> = ActionPayload<
  Partial<Record<"offset" | keyof SelectQueryParams<Fields>, unknown>>,
  never
>;

export type SelectQueryParams<Fields extends UnknownFields> = {
  fields?: FieldName<Fields>[];
  filterByFormula?: Formula; // TODO constrain Formula to Fields
  maxRecords?: number;
  pageSize?: number;
  sort?: SortParam<Fields>;
  view?: string;
  cellFormat?: CellFormat;
  timeZone?: TimeZone;
  userLocale?: UserLocale;
};

export type SelectQueryDataSource<
  Fields extends UnknownFields
> = FieldsValidator<Fields> & ActionPoint;

export class SelectQuery<Fields extends UnknownFields>
  implements AsyncIterable<AirtableRecord<Fields>> {
  public readonly table: SelectQueryDataSource<Fields>;
  public readonly params: SelectQueryParams<Fields>;

  constructor(
    table: SelectQueryDataSource<Fields>,
    param: SelectQueryParams<Fields>
  ) {
    this.table = table;
    this.params = param;
  }

  private createQueryPayload(offset?: string): SelectQueryPayload<Fields> {
    const { filterByFormula: formula, ...params } = this.params;
    return {
      query: {
        ...params,
        filterByFormula: formula && compile(formula),
        offset,
      },
    };
  }

  async fetchRecords(
    payload: SelectQueryPayload<Fields>
  ): Promise<{
    records: AirtableRecord<Fields>[];
    offset?: string;
  }> {
    const { offset, records } = await this.table.runAction("GET", {
      payload,
      responseValidation: new QueryPageResultValidation(this.table),
    });

    return {
      records: records
        ? AirtableRecord.fromMultiRecordData(this.table, { records })
        : [],
      offset,
    };
  }

  /**
   * For cross-compatiblity with the offiical client.
   *
   * @deprecated
   */

  firstPage(): Promise<AirtableRecord<Fields>[]> {
    return this.getPage();
  }

  pageIterable(): AsyncIterable<AirtableRecord<Fields>[]> {
    const load = (offset?: string) =>
      this.fetchRecords(this.createQueryPayload(offset));

    return {
      async *[Symbol.asyncIterator]() {
        let offset: string | undefined;

        do {
          const { records, offset: nextOffset } = await load(offset);

          yield records;

          offset = nextOffset;
        } while (offset);
      },
    };
  }

  /**
   * For cross-compatibility with the official client.
   *
   * @deprecated
   * @param handler
   */

  async eachPage(
    handler: (records: AirtableRecord<Fields>[]) => void
  ): Promise<void> {
    for await (const records of this.pageIterable()) {
      handler(records);
    }
  }

  async getPage(offset?: string): Promise<AirtableRecord<Fields>[]> {
    const { records } = await this.fetchRecords(
      this.createQueryPayload(offset)
    );
    return records;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<AirtableRecord<Fields>> {
    for await (const records of this.pageIterable()) {
      for (const record of records) {
        yield record;
      }
    }
  }

  /**
   * For cross-compatibility with the official client.
   *
   * @deprecated
   */

  async all(): Promise<AirtableRecord<Fields>[]> {
    const records: AirtableRecord<Fields>[] = [];

    for await (const page of this.pageIterable()) {
      records.push(...page);
    }

    return records;
  }
}
