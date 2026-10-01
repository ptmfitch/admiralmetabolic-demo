DEMO / SYNTHETIC · for enablement only

# Repository hooks

Illustrative only. These hooks produce evidence for your validated process. They do not make the package or the study validated.

Project hooks live in `.cursor/hooks.json`. Scripts run from the repository root and need `python3` on `PATH`. Each script prints allow or deny. None of them return ask, because a cloud run has nobody to answer a prompt.

## guard-validated-env.sh

Runs before every shell command (`failClosed`: if the script errors, the command is blocked).

It denies the command when any of these are true:

- The command text mentions `unblinding_key` (read, copy, or join into an output such as `adwl.csv`).
- The command targets a governed lakehouse host (`databricks.com`, `azuredatabricks.net`, `dbfs:`, or an `adb-` workspace host).
- A context, profile, workspace, var-file, master, or host resolves to `validated`, `prod`, or `production`.

Local use is allowed, including `localhost`, `127.0.0.1`, `Rscript inst/demo/run_pipeline.R`, and `make test`. A dev profile that is not named prod, production, or validated is allowed.

The guard matches patterns in the command text. A client whose default config already points at a governed workspace, with none of those words on the command line, can get through. This is a demo guardrail, not complete enforcement.

## deny-restricted-data.sh

Runs before a file read (`failClosed`). The event matcher only sees the tool name, so the script checks the path itself, plus attachment paths.

It denies:

- `unblinding_key.csv` anywhere in the path (`inst/demo/data/unblinding_key.csv` is the demo file)
- anything under a `restricted/` directory
- `*.phi` and `*.pii`
- `.env*`

A missing path or unreadable payload is denied. The response is allow or deny.

There is no sample unblinding file in this change. Cloud agents do not run hooks in their early read-only turns, so a committed key could still be ingested before the hook runs. Keep that file out of the repository unless a later change adds it under the same guard.

## log-to-compliance.sh

Runs after a file edit and when the agent stops. It appends one JSON line to `docs/audit/agent-hooks.jsonl`: a timestamp, the event name, a file path or a short summary, and the conversation id when the payload includes one. Edit contents are not stored. The log is gitignored. The script always allows the action and never blocks.

The location and the reason it is gitignored are documented in `docs/audit/README.md`.

## Check

```bash
bash scripts/test-hooks.sh
```

That script proves the allow and deny cases, proves the audit file grows by append, and runs a dry check of the evidence-pack comment renderer. It does not call GitHub.
