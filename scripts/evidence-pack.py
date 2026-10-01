#!/usr/bin/env python3
"""Render and publish the single Compliance Evidence Pack comment.

DEMO / SYNTHETIC · for enablement only. The comment produces evidence for a
validated process. It does not approve a change. Network calls happen only
for the publish command, and they use GITHUB_TOKEN.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request

MARKER = "<!-- compliance-evidence-pack -->"
DENY_PROJECTS = {
    "ANNEX",
    "CFR",
    "CSV",
    "DEMO",
    "FDA",
    "GAMP",
    "HTTP",
    "HTTPS",
    "ISO",
    "PART",
    "RFC",
    "SHA",
    "SOP",
    "URL",
}
KEY_RE = re.compile(r"(?<![A-Z0-9])([A-Z][A-Z0-9]{1,9}-\d{1,7})(?!\d)")
ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def extract_keys(*texts: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for text in texts:
        upper = text or ""
        upper = upper.upper()
        for match in KEY_RE.finditer(upper):
            key = match.group(1)
            project = key.split("-", 1)[0]
            if project in DENY_PROJECTS or key in seen:
                continue
            seen.add(key)
            found.append(key)
    return found


def validated_paths(paths: list[str]) -> list[str]:
    kept: list[str] = []
    seen: set[str] = set()
    for path in paths:
        norm = (path or "").replace("\\", "/").strip()
        while norm.startswith("./"):
            norm = norm[2:]
        norm = norm.lstrip("/")
        if not (
            norm == "inst/demo"
            or norm.startswith("inst/demo/")
            or norm == "R"
            or norm.startswith("R/")
        ):
            continue
        if norm not in seen:
            seen.add(norm)
            kept.append(norm)
    return kept


def _summary(log_text: str) -> str:
    cleaned = ANSI_RE.sub("", log_text or "").replace("```", "'''").strip()
    if not cleaned:
        return "(no log)"
    lines = cleaned.splitlines()
    tail = "\n".join(lines[-30:])
    if len(tail) > 4000:
        tail = tail[-4000:]
    return tail


def render_comment(
    *,
    sha: str,
    keys: list[str],
    test_command: str,
    exit_code: int | None,
    log_text: str,
    raw_files: list[str],
) -> str:
    if keys:
        linked = "\n".join(f"- `{key}`" for key in keys)
    else:
        linked = "none found in the pull request body or branch name"
    if exit_code is None:
        result = "not run"
    elif exit_code == 0:
        result = "passed (exit 0)"
    else:
        result = f"failed (exit {exit_code})"
    files = validated_paths(raw_files)
    if files:
        file_block = "\n".join(f"- `{path}`" for path in files)
    else:
        file_block = "none"
    summary = _summary(log_text)
    return (
        f"{MARKER}\n"
        "DEMO / SYNTHETIC · for enablement only\n"
        "\n"
        "Illustrative only. This comment produces evidence for your validated process. "
        "It is not an approval.\n"
        "\n"
        "## Compliance Evidence Pack\n"
        f"Updated for {sha}\n"
        "\n"
        "### Linked change request\n"
        f"{linked}\n"
        "\n"
        "### Test results\n"
        f"Command: `{test_command}`\n"
        f"Result: {result}\n"
        "\n"
        "Summary:\n"
        "\n"
        "```\n"
        f"{summary}\n"
        "```\n"
        "\n"
        "### Validated paths changed\n"
        f"{file_block}\n"
        "\n"
        "### Scope\n"
        "Validated paths checked here are `inst/demo/**` and `R/**`. "
        "QA has not accepted a risk tier. See SOP-DEMO-017.\n"
    )


def find_pack_comment(comments: list[dict]) -> int | None:
    for comment in comments:
        body = comment.get("body") or ""
        if MARKER in body:
            comment_id = comment.get("id")
            if isinstance(comment_id, int):
                return comment_id
    return None


def _read_text(path: str) -> str:
    with open(path, encoding="utf-8", errors="replace") as handle:
        return handle.read()


def read_evidence(directory: str) -> tuple[str, int | None, str]:
    if not directory:
        return "not run", None, ""
    command = "not run"
    command_path = os.path.join(directory, "command")
    if os.path.isfile(command_path):
        command = _read_text(command_path).strip() or "not run"
    exit_code: int | None = None
    code_path = os.path.join(directory, "exit_code")
    if os.path.isfile(code_path):
        text = _read_text(code_path).strip()
        if text.lstrip("-").isdigit():
            exit_code = int(text)
    log_text = ""
    log_path = os.path.join(directory, "test.log")
    if os.path.isfile(log_path):
        log_text = _read_text(log_path)
    return command, exit_code, log_text


def _next_link(link_header: str | None) -> str | None:
    if not link_header:
        return None
    for part in link_header.split(","):
        if 'rel="next"' not in part:
            continue
        url = part.split(";", 1)[0].strip()
        if url.startswith("<") and ">" in url:
            return url[1 : url.index(">")]
    return None


def _api(method: str, url: str, token: str, payload: dict | None = None):
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    request.add_header("User-Agent", "admiralmetabolic-demo-evidence-pack")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode("utf-8")
            link = response.headers.get("Link")
            body = json.loads(raw) if raw else {}
            return body, link
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(
            f"GitHub API {method} {url} failed: {exc.code} {detail}"
        ) from exc


def _paginate(url: str, token: str) -> list:
    items: list = []
    while url:
        body, link = _api("GET", url, token)
        if not isinstance(body, list):
            raise SystemExit(f"Expected a list from {url}")
        items.extend(body)
        url = _next_link(link) or ""
    return items


def publish() -> None:
    token = os.environ.get("GITHUB_TOKEN") or ""
    repo = os.environ.get("GITHUB_REPOSITORY") or ""
    number = os.environ.get("PR_NUMBER") or ""
    sha = os.environ.get("HEAD_SHA") or ""
    branch = os.environ.get("HEAD_REF") or ""
    if not token or not repo or not number or not sha:
        raise SystemExit(
            "publish needs GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, and HEAD_SHA"
        )
    base = f"https://api.github.com/repos/{repo}"
    pull, _link = _api("GET", f"{base}/pulls/{number}", token)
    if not isinstance(pull, dict):
        raise SystemExit("Pull request payload was not an object")
    body_text = pull.get("body") or ""
    if not branch:
        head = pull.get("head") or {}
        if isinstance(head, dict):
            branch = head.get("ref") or ""
    files = _paginate(f"{base}/pulls/{number}/files?per_page=100", token)
    paths = []
    for item in files:
        if isinstance(item, dict):
            paths.append(str(item.get("filename") or ""))
    command, exit_code, log_text = read_evidence(os.environ.get("EVIDENCE_DIR") or "")
    comment = render_comment(
        sha=sha,
        keys=extract_keys(body_text, branch),
        test_command=command,
        exit_code=exit_code,
        log_text=log_text,
        raw_files=paths,
    )
    existing = _paginate(f"{base}/issues/{number}/comments?per_page=100", token)
    comment_id = find_pack_comment(existing)
    if comment_id is None:
        _api("POST", f"{base}/issues/{number}/comments", token, {"body": comment})
        print(f"Created evidence-pack comment for {sha}")
        return
    _api("PATCH", f"{base}/issues/comments/{comment_id}", token, {"body": comment})
    print(f"Updated evidence-pack comment {comment_id} for {sha}")


def self_test() -> None:
    keys = extract_keys("Please fix CAD-1 today", "cursor/fix-cad-12-extra")
    if keys != ["CAD-1", "CAD-12"]:
        raise SystemExit(f"keys from body and branch: {keys}")
    if extract_keys("See SOP-DEMO-017 and GAMP category 5", ""):
        raise SystemExit("SOP and GAMP text was parsed as a ticket")
    if extract_keys("", "cursor/responder-boundary-cad-1") != ["CAD-1"]:
        raise SystemExit("branch key was not normalized")
    if extract_keys("Record CR-00100", "") != ["CR-00100"]:
        raise SystemExit("CR id was not parsed")
    if extract_keys("setup-r-dependencies@v2 and Part 11", "main"):
        raise SystemExit("non-ticket text was parsed as a key")

    body = render_comment(
        sha="abc123def456",
        keys=["CAD-1"],
        test_command="make test",
        exit_code=0,
        log_text="all good\n",
        raw_files=[
            "inst/demo/run_pipeline.R",
            "README.md",
            "R/derive_advs_params.R",
            "tests/testthat/test-demo.R",
        ],
    )
    if MARKER not in body:
        raise SystemExit("missing marker")
    if "Updated for abc123def456" not in body:
        raise SystemExit("missing Updated for line")
    if "CAD-1" not in body or "passed (exit 0)" not in body:
        raise SystemExit(body)
    if "inst/demo/run_pipeline.R" not in body or "R/derive_advs_params.R" not in body:
        raise SystemExit(body)
    if "README.md" in body or "tests/testthat" in body:
        raise SystemExit("non-validated path leaked into the comment")
    if "DEMO / SYNTHETIC · for enablement only" not in body:
        raise SystemExit("missing demo banner")

    failed = render_comment(
        sha="deadbeef",
        keys=[],
        test_command="make test",
        exit_code=1,
        log_text="",
        raw_files=["NEWS.md"],
    )
    if "Updated for deadbeef" not in failed:
        raise SystemExit(failed)
    if "none found" not in failed or "\nnone\n" not in failed:
        raise SystemExit(failed)
    if "failed (exit 1)" not in failed:
        raise SystemExit(failed)

    comments = [
        {"id": 1, "body": "hello"},
        {"id": 2, "body": f"{MARKER}\n## Compliance Evidence Pack\n"},
        {"id": 3, "body": "other"},
    ]
    if find_pack_comment(comments) != 2:
        raise SystemExit("did not find the existing evidence-pack comment")
    if find_pack_comment([{"id": 4, "body": "nope"}]) is not None:
        raise SystemExit("found a pack comment that was not there")
    print("OK: evidence pack renderer")


def main(argv: list[str]) -> None:
    command = argv[1] if len(argv) > 1 else ""
    if command == "self-test":
        self_test()
        return
    if command == "publish":
        publish()
        return
    print("usage: evidence-pack.py self-test|publish", file=sys.stderr)
    raise SystemExit(2)


if __name__ == "__main__":
    main(sys.argv)
