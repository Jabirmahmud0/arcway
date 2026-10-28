# Document AI evaluation

Open **AI evaluation** as a Reviewer and run a benchmark for Gemini or Groq. A run makes five API calls using only synthetic fixtures. Your uploaded documents are not included. A provider is pinned for each run; fallback cannot hide its failures. The existing deterministic rules suite remains separate below the model benchmark.

Fixtures cover a full invoice, a packing list without prices, a zero-value invoice, unrelated text, and an embedded instruction. Each fixture explicitly defines all expected fields, with unspecified fields expected to be empty. Numeric formatting and case/whitespace are normalized. A wrong populated value counts as both a false positive and a false negative. An invented value is a false positive; a missing expected value is a false negative.

- Precision measures how many extracted facts match expected facts.
- Recall measures how many expected facts were recovered.
- F1 combines precision and recall.
- Exact document matches require every field to match and the model request to complete.
- Failed provider calls are counted separately and receive zero exact-field credit, including fixtures whose expected answers are empty.

The report retains the suite fingerprint, provider, returned model IDs, prompt version, latency, mismatches, and completion counts. Reports live under the persistent `AI_EVALUATION_DIR`, scoped to each workspace. The UI limits overlapping runs and rapid retries within an app process; API-provider quotas still apply across instances. Reports are private and Reviewer-controlled.

CLI: `pnpm ai:evaluate --provider=gemini --workspace=WORKSPACE_ID` (or `groq`). This stores a measured report visible in that workspace. CLI runs are administrative and do not impersonate a reviewer audit action.

Five synthetic English text cases are a regression benchmark, not a representative held-out production dataset. They do not measure OCR, scanned PDFs, other languages, complex tables, or real-world error rates. Broader accuracy claims require a consented, labeled document corpus. Confidence returned by a model is not calibrated accuracy.
