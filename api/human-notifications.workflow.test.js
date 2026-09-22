import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const workflowText = readFileSync(
  new URL("../.github/workflows/human-notifications.yml", import.meta.url),
  "utf8",
);
const workflow = parse(workflowText);

function assertReadOnlyPermissions(value) {
  expect(value).not.toBe("write-all");
  expect(value).not.toBe("read-all");
  expect(value).toEqual({
    contents: "read",
    "pull-requests": "read",
  });
  for (const level of Object.values(value)) {
    expect(level).not.toBe("write");
  }
}

describe("human notification workflow security contract", () => {
  it("parses the YAML and enforces the exact documented trigger set", () => {
    expect(workflow).toBeTypeOf("object");
    expect(workflow.on.pull_request_target.types).toEqual([
      "opened",
      "ready_for_review",
      "review_requested",
    ]);
    expect(workflow.on.workflow_run.types).toEqual(["completed"]);
    expect(workflow.on.workflow_run.workflows).toEqual([
      "Application CI",
      "Database CI",
      "Security",
      "Intelligence CI",
      "Fiscal Bridge",
    ]);
  });

  it("enforces exact read-only workflow permissions and forbids job-level escalation", () => {
    assertReadOnlyPermissions(workflow.permissions);
    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      expect(job.permissions, `${jobName} must not override workflow permissions`).toBeUndefined();
    }
  });

  it("keeps bridge secrets unavailable to PRs from forks", () => {
    const job = workflow.jobs["notify-pr"];
    expect(job.if).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository",
    );

    for (const currentJob of Object.values(workflow.jobs)) {
      for (const step of currentJob.steps ?? []) {
        expect(step.uses ?? "").not.toMatch(/actions\/checkout/i);
      }
    }
  });

  it("keeps notification transport fail-open and authority-free", () => {
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        const run = step.run ?? "";
        expect(run).not.toMatch(/gh\s+pr\s+(merge|review|close|ready)/);
        expect(run).not.toMatch(/reply_markup|inline_keyboard/);
      }
    }

    const runs = Object.values(workflow.jobs)
      .flatMap((job) => job.steps ?? [])
      .map((step) => step.run ?? "")
      .join("\n");

    expect(runs).toContain("Human notification skipped:");
    expect(runs).toContain("if ! curl --fail-with-body");
    expect(runs).toContain("Human notification delivery failed; main workflow remains fail-open");
  });
});
