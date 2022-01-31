---
"@qualifyze/airtable": major
---

[BREAKING CHANGE] Introduce `AirtableError` extending `Error` to bring the stack trace very useful for debugging.
The consumers should check their code for usage of `Airtable.Error` from the official client and replace it with the one from this library.
