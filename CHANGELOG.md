# @qualifyze/airtable

## 2.0.0

### Major Changes

- [#88](https://github.com/Qualifyze/airtable/pull/88) [`b2569be`](https://github.com/Qualifyze/airtable/commit/b2569be688d699f545b314193f59cdcf354e651f) Thanks [@vubogovich](https://github.com/vubogovich)! - [BREAKING CHANGE] Introduce `AirtableError` extending `Error` to bring the stack trace very useful for debugging.
  The consumers should check their code for usage of `Airtable.Error` from the official client and replace it with the one from this library.

* [#73](https://github.com/Qualifyze/airtable/pull/73) [`f434e51`](https://github.com/Qualifyze/airtable/commit/f434e510ab0b033cc094e29314f75b8f5d8b8665) Thanks [@vubogovich](https://github.com/vubogovich)! - [BREAKING CHANGE] Make AirtableRecord.data non-nullable.
  It's always an object once any operation is executed, and it's inconvenient
  to cast it to non-nullable in the calling code. The consumers should check
  their code for `AirtableRecord` constructor or `data` property usage.

### Minor Changes

- [#87](https://github.com/Qualifyze/airtable/pull/87) [`3ec4b07`](https://github.com/Qualifyze/airtable/commit/3ec4b07f8fe7b134952c08d08e5ef7346c4edcde) Thanks [@vubogovich](https://github.com/vubogovich)! - Add table method `findOrNull` which returns `null` when the record is not found by id.

* [#89](https://github.com/Qualifyze/airtable/pull/89) [`e65c839`](https://github.com/Qualifyze/airtable/commit/e65c8394519b9d79abd3658ead608f1e2d422f02) Thanks [@vubogovich](https://github.com/vubogovich)! - Improve data validations:
  - make the final error message more concise
  - include record id to the record validation context
  - don't stop validating multiple records on first error
  - cover with tests

### Patch Changes

- [#90](https://github.com/Qualifyze/airtable/pull/90) [`cda0af2`](https://github.com/Qualifyze/airtable/commit/cda0af28fec2155c7986ecefbcff5f9d74e54b3f) Thanks [@vubogovich](https://github.com/vubogovich)! - Bugfix: use correct type for the sort parameter.

* [#86](https://github.com/Qualifyze/airtable/pull/86) [`15d5113`](https://github.com/Qualifyze/airtable/commit/15d5113dd44b962327f982d344e8c730b105f81c) Thanks [@vubogovich](https://github.com/vubogovich)! - Bump airtable to 0.11.1.

- [#85](https://github.com/Qualifyze/airtable/pull/85) [`65ce99e`](https://github.com/Qualifyze/airtable/commit/65ce99ed91fad10e52a604176d2a93714456c727) Thanks [@vubogovich](https://github.com/vubogovich)! - Bugfix: use partial type for the update operations to align with Airtable API.

## 1.1.2

### Patch Changes

- [#75](https://github.com/Qualifyze/airtable/pull/75) [`05225a5`](https://github.com/Qualifyze/airtable/commit/05225a5b35f5c550ce28bf3a379f1f3df5b5ae7d) Thanks [@vubogovich](https://github.com/vubogovich)! - Setup [changesets](https://github.com/atlassian/changesets) for the repo.
