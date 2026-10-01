DEMO / SYNTHETIC · for enablement only

# Agent audit trail

Illustrative only. This trail produces evidence for your validated process. It is not an electronic signature, an audit trail under your quality system, or a Part 11 record.

## Where it lives

Cursor's `afterFileEdit` and `stop` hooks append one JSON object per line to:

`docs/audit/agent-hooks.jsonl`

The hook script is `.cursor/hooks/log-to-compliance.sh`. It opens the file in append mode and does not rewrite earlier lines. Each line has:

- `timestamp` — UTC time the hook ran
- `event` — `afterFileEdit` or `stop`
- `file_path` — path of an edit, when the payload includes one
- `summary` — short status text for a `stop` event
- `conversation_id` — present when the payload includes one

The hook does not write file contents, diffs, or shell output. A line looks like this synthetic example:

```json
{"timestamp":"2026-01-01T00:00:00Z","event":"afterFileEdit","file_path":"inst/demo/run_pipeline.R","conversation_id":"example"}
```

## Why the log is not committed

`docs/audit/*.jsonl` is gitignored. The file can contain conversation ids from local agent sessions, and it grows on every edit. Commit the explanation (this file). Export a copy into the change record when a person wants it kept.

Deleting or truncating the local file is outside the hook. The hook itself only appends. A human QA role assesses changes to the hook script before merge (see `.cursor/BUGBOT.md`).

## How to verify

From the repository root:

```bash
bash scripts/test-hooks.sh
```

The script feeds an edit event and a stop event at a temporary project directory and checks that two JSON lines were appended, in order, without the edited text.
