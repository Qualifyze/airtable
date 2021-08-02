---
"@qualifyze/airtable": major
---

[BREAKING CHANGE] Make AirtableRecord.data non-nullable.
It's always an object once any operation is executed, and it's inconvenient
to cast it to non-nullable in the calling code. The consumers should check
their code for `AirtableRecord` constructor or `data` property usage.
