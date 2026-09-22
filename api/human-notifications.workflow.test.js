import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  new URL("../.github/workflows/human-notifications.yml", import.meta.url),
  "utf8",
);

describe("human notification workflow security contract", () => {
  it("uses the documented trigger set and minimum read-only permissions", () => {
    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("types: [opened, ready_for_review, review_requested]");
    expect(workflow).toContain("workflow_run:");
    expect(workflow).toContain('workflows: ["Application CI", "Database CI", "Security", "Intelligence CI", "Fiscal Bridge"]');
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pull-requests: read");
    expect(workflow).not.toMatch(/contents:\s*write/);
    expect(workflow).not.toMatch(/pull-requests:\s*write/);
  });

  it("does not expose bridge secrets to pull requests from forks", () => {
    expect(workflow).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository",
    );
    expect(workflow).not.toMatch(/\bcheckout\b/i);
  });

  it("keeps notification transport fail-open and authority-free", () => {
    expect(workflow).toContain('echo "::warning::Human notification skipped:');
    expect(workflow).toContain("if ! curl --fail-with-body");
    expect(workflow).toContain('echo "::warning::Human notification delivery failed; main workflow remains fail-open"');
    expect(workflow).not.toMatch(/gh\s+pr\s+(merge|review|close|ready)/);
    expect(workflow).not.toMatch(/reply_markup|inline_keyboard/);
  });
});
