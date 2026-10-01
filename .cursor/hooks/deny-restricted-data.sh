#!/usr/bin/env bash
# beforeReadFile: the matcher only sees the tool name, so the path check is here.
# Denies the unblinding key, restricted/, *.phi, *.pii, and .env*. Never returns "ask".
exec python3 -c "$(cat <<'PY'
from __future__ import annotations
import fnmatch
import json
import sys


def emit(permission: str, message: str | None = None) -> None:
    payload: dict[str, str] = {"permission": permission}
    if message:
        payload["user_message"] = message
        payload["agent_message"] = message
    json.dump(payload, sys.stdout)
    sys.stdout.write("\n")


def reason_for(path: str) -> str | None:
    if not path or not str(path).strip():
        return "missing path"
    normalized = str(path).replace("\\", "/")
    parts = [part for part in normalized.split("/") if part not in ("", ".")]
    if "restricted" in parts:
        return "restricted directory"
    base = parts[-1] if parts else ""
    lowered = base.lower()
    if lowered == "unblinding_key.csv":
        return "unblinding key"
    if lowered.endswith(".phi") or lowered.endswith(".pii"):
        return "restricted data file"
    if fnmatch.fnmatch(base, ".env*") or fnmatch.fnmatch(lowered, ".env*"):
        return "env file"
    return None


def collect_paths(value: object, found: list[str]) -> None:
    if isinstance(value, str):
        found.append(value)
    elif isinstance(value, dict):
        for key in ("file_path", "path", "target_file", "file"):
            item = value.get(key)
            if isinstance(item, str) and item.strip():
                found.append(item)


def paths_from(data: dict) -> list[str]:
    found: list[str] = []
    collect_paths(data, found)
    for attachment in data.get("attachments") or []:
        if isinstance(attachment, dict):
            collect_paths(attachment, found)
    if not found:
        found.append("")
    return found


def main() -> None:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        emit(
            "deny",
            "Denied: the read hook could not read its input, so the read is blocked.",
        )
        return

    if not isinstance(data, dict):
        emit("deny", "Denied: the read hook received an unexpected payload.")
        return

    reasons = [reason_for(path) for path in paths_from(data)]
    denied = [reason for reason in reasons if reason]
    if denied:
        if "unblinding key" in denied:
            emit(
                "deny",
                "Denied: inst/demo/data/unblinding_key.csv is restricted. "
                "Do not read the unblinding key into agent context or join it into outputs.",
            )
            return
        emit(
            "deny",
            "Denied: that path is restricted (unblinding key, restricted/, .env*, .phi, or .pii).",
        )
        return
    emit("allow")


if __name__ == "__main__":
    main()
PY
)"
