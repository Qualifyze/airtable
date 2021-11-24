# @qualifyze/airtable

## 2.0.0

### Major Changes

- [#73](https://github.com/Qualifyze/airtable/pull/73) [`f434e51`](https://github.com/Qualifyze/airtable/commit/f434e510ab0b033cc094e29314f75b8f5d8b8665) Thanks [@vubogovich](https://github.com/vubogovich)! - [BREAKING CHANGE] Make AirtableRecord.data non-nullable.
  It's always an object once any operation is executed, and it's inconvenient
  to cast it to non-nullable in the calling code. The consumers should check
  their code for `AirtableRecord` constructor or `data` property usage.

## 1.1.2

### Patch Changes

- [#75](https://github.com/Qualifyze/airtable/pull/75) [`05225a5`](https://github.com/Qualifyze/airtable/commit/05225a5b35f5c550ce28bf3a379f1f3df5b5ae7d) Thanks [@vubogovich](https://github.com/vubogovich)! - Setup [changesets](https://github.com/atlassian/changesets) for the repo.
