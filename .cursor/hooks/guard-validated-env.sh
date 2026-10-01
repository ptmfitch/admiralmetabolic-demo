#!/usr/bin/env bash
# beforeShellExecution: deny governed-lakehouse targets and any use of the unblinding key.
# Local development commands are allowed. Never returns "ask".
exec python3 -c "$(cat <<'PY'
from __future__ import annotations
import json
import re
import sys
from urllib.parse import urlparse

ENV_TOKENS = {"prod", "production", "validated"}
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}

TARGET_PATTERNS = (
    r"--context(?:=|\s+)(\S+)",
    r"use-context(?:\s+)(\S+)",
    r"--server(?:=|\s+)(\S+)",
    r"--cluster(?:=|\s+)(\S+)",
    r"(?:(?<=\s)|^)-h(?:=|\s*)(\S+)",
    r"--host(?:=|\s+)(\S+)",
    r"--hostname(?:=|\s+)(\S+)",
    r"--profile(?:=|\s+)(\S+)",
    r"--workspace-url(?:=|\s+)(\S+)",
    r"workspace\s+(?:select|new)\s+(\S+)",
    r"-var-file(?:=|\s+)(\S+)",
    r"TF_WORKSPACE=(\S+)",
    r"--backend-config(?:=|\s+)(\S+)",
    r"--master(?:=|\s+)(\S+)",
    r"postgres(?:ql)?://\S+",
    r"spark://\S+",
    r"jdbc:\S+",
    r"https?://\S+",
)

LAKEHOUSE_HOST = re.compile(
    r"databricks\.com|azuredatabricks\.net|cloud\.databricks|adb-\d+|dbfs:",
    re.IGNORECASE,
)
UNBLINDING = re.compile(r"unblinding_key", re.IGNORECASE)


def clean(value: str) -> str:
    return value.strip().strip("'\"")


def tokens(value: str) -> set[str]:
    return {part.lower() for part in re.split(r"[^A-Za-z0-9]+", value) if part}


def is_env_target(value: str) -> bool:
    return bool(tokens(value) & ENV_TOKENS)


def host_of(value: str) -> str | None:
    text = clean(value)
    if "://" not in text:
        return None
    return urlparse(text).hostname


def emit(permission: str, message: str | None = None) -> None:
    payload: dict[str, str] = {"permission": permission}
    if message:
        payload["user_message"] = message
        payload["agent_message"] = message
    json.dump(payload, sys.stdout)
    sys.stdout.write("\n")


def main() -> None:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        emit(
            "deny",
            "Denied: the shell hook could not read its input, so the command is blocked.",
        )
        return

    if not isinstance(data, dict):
        emit("deny", "Denied: the shell hook received an unexpected payload.")
        return

    command = str(data.get("command") or "")
    if not command.strip():
        emit("allow")
        return

    if UNBLINDING.search(command):
        emit(
            "deny",
            "Denied: the unblinding key must not be read, copied, or joined into study outputs.",
        )
        return

    if LAKEHOUSE_HOST.search(command):
        emit(
            "deny",
            "Denied: this command targets a governed lakehouse host. Local development commands are allowed.",
        )
        return

    for pattern in TARGET_PATTERNS:
        for match in re.finditer(pattern, command, flags=re.IGNORECASE):
            captured = clean(match.group(0) if match.lastindex is None else match.group(1))
            host = host_of(captured)
            if host:
                if host.lower() in LOCAL_HOSTS:
                    continue
                if is_env_target(host) or is_env_target(captured):
                    emit(
                        "deny",
                        "Denied: this command targets a validated or production host. "
                        "Local development commands are allowed.",
                    )
                    return
                continue
            if is_env_target(captured):
                emit(
                    "deny",
                    "Denied: this command targets a validated or production context, profile, or workspace. "
                    "Local development commands are allowed.",
                )
                return

    emit("allow")


if __name__ == "__main__":
    main()
PY
)"
