#!/usr/bin/env bash
# Pipe sample hook payloads and check allow/deny. Illustrative only.
# DEMO / SYNTHETIC · for enablement only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GUARD="$ROOT/.cursor/hooks/guard-validated-env.sh"
DENY="$ROOT/.cursor/hooks/deny-restricted-data.sh"
LOG="$ROOT/.cursor/hooks/log-to-compliance.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

if ! command -v python3 >/dev/null 2>&1; then
  fail "python3 is required"
fi

permission_of() {
  python3 -c 'import json,sys; print(json.load(sys.stdin)["permission"])'
}

run_perm() {
  local script="$1"
  local expected="$2"
  local payload="$3"
  local out perm
  out="$(printf '%s' "$payload" | "$script")"
  perm="$(printf '%s' "$out" | permission_of)"
  if [[ "$perm" != "$expected" ]]; then
    fail "$script expected $expected, got $perm. payload=$payload output=$out"
  fi
  if [[ "$perm" == "ask" || "$out" == *'"permission": "ask"'* || "$out" == *'"permission":"ask"'* ]]; then
    fail "$script returned ask"
  fi
}

shell_payload() {
  python3 -c 'import json,sys; print(json.dumps({"hook_event_name":"beforeShellExecution","conversation_id":"conv-test","command":sys.argv[1],"cwd":"/workspace","sandbox":False}))' "$1"
}

read_payload() {
  python3 -c 'import json,sys; print(json.dumps({"hook_event_name":"beforeReadFile","conversation_id":"conv-test","file_path":sys.argv[1],"content":"","attachments":json.loads(sys.argv[2])}))' "$1" "$2"
}

echo "guard-validated-env.sh"
run_perm "$GUARD" allow "$(shell_payload "psql -h 127.0.0.1 -d studies")"
run_perm "$GUARD" allow "$(shell_payload "psql -h localhost -d studies")"
run_perm "$GUARD" allow "$(shell_payload "psql postgresql://dev:dev@127.0.0.1:5432/studies")"
run_perm "$GUARD" allow "$(shell_payload "kubectl --context minikube get pods")"
run_perm "$GUARD" allow "$(shell_payload "kubectl config use-context docker-desktop")"
run_perm "$GUARD" allow "$(shell_payload "terraform workspace select dev")"
run_perm "$GUARD" allow "$(shell_payload "terraform apply -var-file=dev.tfvars")"
run_perm "$GUARD" allow "$(shell_payload "Rscript inst/demo/run_pipeline.R")"
run_perm "$GUARD" allow "$(shell_payload "make test")"
run_perm "$GUARD" allow "$(shell_payload "databricks --version")"
run_perm "$GUARD" allow "$(shell_payload "databricks --profile dev clusters list")"
run_perm "$GUARD" allow "$(shell_payload "spark-submit --master spark://localhost:7077 job.py")"
run_perm "$GUARD" deny "$(shell_payload "kubectl --context prod get pods")"
run_perm "$GUARD" deny "$(shell_payload "kubectl --context=validated-cluster get ns")"
run_perm "$GUARD" deny "$(shell_payload "kubectl config use-context production")"
run_perm "$GUARD" deny "$(shell_payload "psql -h prod-db.internal.example -U app")"
run_perm "$GUARD" deny "$(shell_payload "psql -h validated-db.internal -d app")"
run_perm "$GUARD" deny "$(shell_payload "psql postgresql://user:pass@prod-db.example.com:5432/app")"
run_perm "$GUARD" deny "$(shell_payload "terraform workspace select prod")"
run_perm "$GUARD" deny "$(shell_payload "terraform workspace select validated")"
run_perm "$GUARD" deny "$(shell_payload "terraform apply -var-file=environments/prod.tfvars")"
run_perm "$GUARD" deny "$(shell_payload "databricks --profile prod jobs list")"
run_perm "$GUARD" deny "$(shell_payload "databricks --profile=production sql warehouses list")"
run_perm "$GUARD" deny "$(shell_payload "databricks fs cp dbfs:/adwl/adwl.csv .")"
run_perm "$GUARD" deny "$(shell_payload "spark-submit --master spark://validated-cluster:7077 job.py")"
run_perm "$GUARD" deny "$(shell_payload "cp inst/demo/data/unblinding_key.csv inst/demo/output/adwl.csv")"
run_perm "$GUARD" deny "$(shell_payload "Rscript -e 'read.csv(\"inst/demo/data/unblinding_key.csv\")'")"
run_perm "$GUARD" deny "$(printf '%s' 'not-json')"

echo "deny-restricted-data.sh"
run_perm "$DENY" allow "$(read_payload "$ROOT/README.md" "[]")"
run_perm "$DENY" allow "$(read_payload "$ROOT/R/derive_advs_params.R" "[]")"
run_perm "$DENY" allow "$(read_payload "$ROOT/inst/demo/run_pipeline.R" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/inst/demo/data/unblinding_key.csv" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/inst/demo/data/UNBLINDING_KEY.CSV" "[]")"
run_perm "$DENY" deny "$(read_payload 'inst\demo\data\unblinding_key.csv' "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/restricted/notes.txt" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/study/subject.phi" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/study/subject.pii" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/.env" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/.env.local" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/.env.example" "[]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/README.md" "[{\"type\":\"file\",\"file_path\":\"$ROOT/inst/demo/data/unblinding_key.csv\"}]")"
run_perm "$DENY" deny "$(read_payload "$ROOT/README.md" "[{\"type\":\"file\",\"file_path\":\"$ROOT/.env\"}]")"
run_perm "$DENY" deny "$(printf '%s' 'not-json')"
run_perm "$DENY" deny "$(printf '%s' '{}')"

echo "log-to-compliance.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
export CURSOR_PROJECT_DIR="$TMP"
EDIT_PAYLOAD="$(python3 -c 'import json; print(json.dumps({"hook_event_name":"afterFileEdit","conversation_id":"conv-edit","file_path":"inst/demo/run_pipeline.R","edits":[{"old_string":"SECRET_SENTINEL_OLD","new_string":"next"}]}))')"
EDIT_PAYLOAD_2="$(python3 -c 'import json; print(json.dumps({"hook_event_name":"afterFileEdit","conversation_id":"conv-edit-2","file_path":"R/derive_advs_params.R","edits":[{"old_string":"SECRET_SENTINEL_OLD","new_string":"next"}]}))')"
STOP_PAYLOAD="$(python3 -c 'import json; print(json.dumps({"hook_event_name":"stop","conversation_id":"conv-stop","status":"completed","loop_count":0}))')"
EDIT_OUT="$(printf '%s' "$EDIT_PAYLOAD" | "$LOG")"
EDIT_OUT_2="$(printf '%s' "$EDIT_PAYLOAD_2" | "$LOG")"
STOP_OUT="$(printf '%s' "$STOP_PAYLOAD" | "$LOG")"
printf '%s' "$EDIT_OUT" | python3 -c 'import json,sys; data=json.load(sys.stdin); assert data=={}, data'
printf '%s' "$EDIT_OUT_2" | python3 -c 'import json,sys; data=json.load(sys.stdin); assert data=={}, data'
printf '%s' "$STOP_OUT" | python3 -c 'import json,sys; data=json.load(sys.stdin); assert data=={}, data'
python3 - "$TMP/docs/audit/agent-hooks.jsonl" <<'PY'
import json
import sys

path = sys.argv[1]
lines = open(path, encoding="utf-8").read().splitlines()
if len(lines) != 3:
    raise SystemExit(f"expected 3 log lines, got {len(lines)}: {lines}")
edit, edit2, stop = (json.loads(line) for line in lines)
for record in (edit, edit2, stop):
    if not record.get("timestamp"):
        raise SystemExit(f"missing timestamp: {record}")
if edit.get("event") != "afterFileEdit" or edit2.get("event") != "afterFileEdit":
    raise SystemExit((edit, edit2))
if edit.get("file_path") != "inst/demo/run_pipeline.R":
    raise SystemExit(edit)
if edit.get("conversation_id") != "conv-edit":
    raise SystemExit(edit)
if edit2.get("conversation_id") != "conv-edit-2":
    raise SystemExit("second edit did not append")
if stop.get("event") != "stop" or stop.get("conversation_id") != "conv-stop":
    raise SystemExit(stop)
if "status=completed" not in stop.get("summary", ""):
    raise SystemExit(stop)
blob = "\n".join(lines)
if "SECRET_SENTINEL_OLD" in blob or "edits" in blob:
    raise SystemExit("log stored edit contents")
print("log lines ok")
PY

if git -C "$ROOT" check-ignore -q -- "docs/audit/agent-hooks.jsonl"; then
  :
else
  fail "docs/audit/agent-hooks.jsonl is not gitignored"
fi
if git -C "$ROOT" check-ignore -q -- "docs/audit/README.md"; then
  fail "docs/audit/README.md is gitignored"
fi
if git -C "$ROOT" check-ignore -q -- "docs/change-control/validation-plan.md"; then
  fail "docs/change-control/validation-plan.md is gitignored"
fi

echo "evidence-pack renderer"
python3 "$ROOT/scripts/evidence-pack.py" self-test

echo "OK: hook scripts"
